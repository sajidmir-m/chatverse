import { Router } from 'express';
import { authController } from '../controllers/messageController';
import { authenticate, requireProfile } from '../middleware/auth';
import {
  handleValidationErrors,
  validateCreateProfile,
  validateUpdateProfile,
  validateUsernameParam,
} from '../middleware/validators';

const router = Router();

router.get('/me', authenticate, authController.getMe);
router.post(
  '/profile',
  authenticate,
  validateCreateProfile,
  handleValidationErrors,
  authController.createProfile
);
router.put(
  '/profile',
  authenticate,
  requireProfile,
  validateUpdateProfile,
  handleValidationErrors,
  authController.updateProfile
);
router.get(
  '/username/:username/available',
  validateUsernameParam,
  handleValidationErrors,
  authController.checkUsername
);

export default router;
