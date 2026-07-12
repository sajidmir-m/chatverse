import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { socketService } from '../services/socket';
import { CallStatus, CallType } from '../types';
import { useAuth } from './AuthContext';

const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

interface CallState {
  status: CallStatus;
  callId: string | null;
  callType: CallType | null;
  remoteUser: string | null;
  remoteDisplayName: string | null;
  isInitiator: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

interface CallContextValue extends CallState {
  startCall: (to: string, callType: CallType, displayName?: string) => Promise<void>;
  answerCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  isMuted: boolean;
  isVideoOff: boolean;
}

const initialState: CallState = {
  status: 'idle',
  callId: null,
  callType: null,
  remoteUser: null,
  remoteDisplayName: null,
  isInitiator: false,
  localStream: null,
  remoteStream: null,
};

const CallContext = createContext<CallContextValue | undefined>(undefined);

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { username } = useAuth();
  const [state, setState] = useState<CallState>(initialState);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const cleanup = useCallback((): void => {
    pcRef.current?.close();
    pcRef.current = null;
    stateRef.current.localStream?.getTracks().forEach((t) => t.stop());
    setState(initialState);
    setIsMuted(false);
    setIsVideoOff(false);
  }, []);

  const getMedia = useCallback(async (callType: CallType): Promise<MediaStream> => {
    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === 'video',
    });
  }, []);

  const createPeer = useCallback((): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (event) => {
      const s = stateRef.current;
      if (event.candidate && s.callId && s.remoteUser && username) {
        socketService.emitCallEvent('call-ice-candidate', {
          callId: s.callId,
          from: username,
          to: s.remoteUser,
          callType: s.callType!,
          candidate: event.candidate.toJSON(),
        });
      }
    };
    pc.ontrack = (event) => {
      setState((prev) => ({ ...prev, remoteStream: event.streams[0], status: 'connected' }));
    };
    return pc;
  }, [username]);

  const startCall = useCallback(
    async (to: string, callType: CallType, displayName?: string): Promise<void> => {
      if (!username || stateRef.current.status !== 'idle') return;

      const callId = crypto.randomUUID();
      const stream = await getMedia(callType);
      const pc = createPeer();
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      setState({
        status: 'calling',
        callId,
        callType,
        remoteUser: to,
        remoteDisplayName: displayName || to,
        isInitiator: true,
        localStream: stream,
        remoteStream: null,
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketService.emitCallEvent('call-offer', {
        callId,
        from: username,
        to,
        callType,
        sdp: offer,
      });
    },
    [username, getMedia, createPeer]
  );

  const answerCall = useCallback(async (): Promise<void> => {
    const s = stateRef.current;
    if (!username || s.status !== 'incoming' || !s.callId || !s.remoteUser || !s.callType) return;

    const stream = await getMedia(s.callType);
    const pc = createPeer();
    pcRef.current = pc;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    setState((prev) => ({ ...prev, localStream: stream, status: 'connected', isInitiator: false }));

    // SDP stored temporarily on incoming offer handled in effect
    const pendingOffer = (window as unknown as { __pendingOffer?: RTCSessionDescriptionInit }).__pendingOffer;
    if (pendingOffer) {
      await pc.setRemoteDescription(pendingOffer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketService.emitCallEvent('call-answer', {
        callId: s.callId,
        from: username,
        to: s.remoteUser,
        callType: s.callType,
        sdp: answer,
      });
    }
  }, [username, getMedia, createPeer]);

  const rejectCall = useCallback((): void => {
    const s = stateRef.current;
    if (s.callId && s.remoteUser && username) {
      socketService.emitCallEvent('call-reject', {
        callId: s.callId,
        from: username,
        to: s.remoteUser,
        callType: s.callType || 'voice',
      });
    }
    cleanup();
  }, [username, cleanup]);

  const endCall = useCallback((): void => {
    const s = stateRef.current;
    if (s.callId && s.remoteUser && username) {
      socketService.emitCallEvent('call-end', {
        callId: s.callId,
        from: username,
        to: s.remoteUser,
        callType: s.callType || 'voice',
      });
    }
    cleanup();
  }, [username, cleanup]);

  const toggleMute = useCallback((): void => {
    stateRef.current.localStream?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted((m) => !m);
  }, []);

  const toggleVideo = useCallback((): void => {
    stateRef.current.localStream?.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsVideoOff((v) => !v);
  }, []);

  useEffect(() => {
    if (!username) return;

    const unsubOffer = socketService.onCallOffer(async (payload) => {
      if (payload.to !== username) return;
      if (stateRef.current.status !== 'idle') {
        socketService.emitCallEvent('call-busy', {
          callId: payload.callId,
          from: username,
          to: payload.from,
          callType: payload.callType,
        });
        return;
      }

      (window as unknown as { __pendingOffer?: RTCSessionDescriptionInit }).__pendingOffer = payload.sdp;

      setState({
        status: 'incoming',
        callId: payload.callId,
        callType: payload.callType,
        remoteUser: payload.from,
        remoteDisplayName: payload.from,
        isInitiator: false,
        localStream: null,
        remoteStream: null,
      });
    });

    const unsubAnswer = socketService.onCallAnswer(async (payload) => {
      const s = stateRef.current;
      if (payload.to !== username || payload.callId !== s.callId || !pcRef.current) return;
      await pcRef.current.setRemoteDescription(payload.sdp);
      setState((prev) => ({ ...prev, status: 'connected' }));
    });

    const unsubIce = socketService.onCallIceCandidate(async (payload) => {
      const s = stateRef.current;
      if (payload.to !== username || payload.callId !== s.callId || !pcRef.current) return;
      try {
        await pcRef.current.addIceCandidate(payload.candidate);
      } catch {
        /* ignore stale candidates */
      }
    });

    const unsubReject = socketService.onCallReject((payload) => {
      if (payload.to !== username) return;
      cleanup();
    });

    const unsubEnd = socketService.onCallEnd((payload) => {
      if (payload.to !== username) return;
      cleanup();
    });

    const unsubBusy = socketService.onCallBusy((payload) => {
      if (payload.to !== username) return;
      cleanup();
    });

    return () => {
      unsubOffer();
      unsubAnswer();
      unsubIce();
      unsubReject();
      unsubEnd();
      unsubBusy();
    };
  }, [username, cleanup]);

  const value = useMemo(
    () => ({
      ...state,
      startCall,
      answerCall,
      rejectCall,
      endCall,
      toggleMute,
      toggleVideo,
      isMuted,
      isVideoOff,
    }),
    [state, startCall, answerCall, rejectCall, endCall, toggleMute, toggleVideo, isMuted, isVideoOff]
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export const useCall = (): CallContextValue => {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within CallProvider');
  return ctx;
};
