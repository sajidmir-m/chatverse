import { Router } from 'express';
import { userController } from '../controllers/messageController';
import { authenticate, requireProfile } from '../middleware/auth';
import {
  handleValidationErrors,
  validateSearchQuery,
  validateUsernameParam,
} from '../middleware/validators';

const router = Router();

router.get('/', authenticate, requireProfile, userController.getOnlineUsers);
router.get(
  '/search',
  authenticate,
  requireProfile,
  validateSearchQuery,
  handleValidationErrors,
  userController.searchUsers
);
router.get(
  '/:username',
  authenticate,
  requireProfile,
  validateUsernameParam,
  handleValidationErrors,
  userController.getUserByUsername
);

export default router;
