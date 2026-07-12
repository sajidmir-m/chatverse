import { Router } from 'express';
import { friendController } from '../controllers/friendController';
import { authenticate, requireProfile } from '../middleware/auth';
import { handleValidationErrors, validateSearchQuery, validateSendFriendRequest } from '../middleware/validators';

const router = Router();

router.get('/conversations', authenticate, requireProfile, friendController.getConversations);
router.get('/', authenticate, requireProfile, friendController.getFriends);
router.get(
  '/search',
  authenticate,
  requireProfile,
  validateSearchQuery,
  handleValidationErrors,
  friendController.searchUsers
);
router.get('/requests/incoming', authenticate, requireProfile, friendController.getIncomingRequests);

router.post(
  '/request',
  authenticate,
  requireProfile,
  validateSendFriendRequest,
  handleValidationErrors,
  friendController.sendRequest
);

router.post('/requests/:id/accept', authenticate, requireProfile, friendController.acceptRequest);
router.post('/requests/:id/reject', authenticate, requireProfile, friendController.rejectRequest);

export default router;
