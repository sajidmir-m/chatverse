import React, { useEffect, useRef } from 'react';
import { useCall } from '../contexts/CallContext';
import './CallOverlay.css';

export const CallOverlay: React.FC = () => {
  const {
    status,
    callType,
    remoteDisplayName,
    localStream,
    remoteStream,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    isMuted,
    isVideoOff,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  if (status === 'idle' || status === 'ended') return null;

  const isVideo = callType === 'video';

  return (
    <div className="call-overlay">
      <div className="call-overlay__content">
        <p className="call-overlay__status">
          {status === 'calling' && `Calling ${remoteDisplayName}...`}
          {status === 'incoming' && `Incoming ${isVideo ? 'video' : 'voice'} call`}
          {status === 'connected' && remoteDisplayName}
        </p>

        <div className={`call-overlay__videos ${isVideo ? '' : 'call-overlay__videos--voice'}`}>
          {isVideo && (
            <>
              <video ref={remoteVideoRef} autoPlay playsInline className="call-overlay__remote" />
              <video ref={localVideoRef} autoPlay playsInline muted className="call-overlay__local" />
            </>
          )}
          {!isVideo && status === 'connected' && (
            <div className="call-overlay__voice-avatar">
              {remoteDisplayName?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="call-overlay__controls">
          {status === 'incoming' && (
            <>
              <button type="button" className="call-overlay__btn call-overlay__btn--accept" onClick={answerCall}>
                Accept
              </button>
              <button type="button" className="call-overlay__btn call-overlay__btn--reject" onClick={rejectCall}>
                Decline
              </button>
            </>
          )}

          {(status === 'calling' || status === 'connected') && (
            <>
              <button type="button" className="call-overlay__btn" onClick={toggleMute}>
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
              {isVideo && (
                <button type="button" className="call-overlay__btn" onClick={toggleVideo}>
                  {isVideoOff ? 'Camera On' : 'Camera Off'}
                </button>
              )}
              <button type="button" className="call-overlay__btn call-overlay__btn--reject" onClick={endCall}>
                End
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
