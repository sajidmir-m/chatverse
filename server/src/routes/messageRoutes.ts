import { Router } from 'express';
import { messageController } from '../controllers/messageController';
import { authenticate, requireProfile } from '../middleware/auth';
import {
  handleValidationErrors,
  validateCreateMessage,
  validateRecipientParam,
} from '../middleware/validators';

const router = Router();

router.get(
  '/:recipient',
  authenticate,
  requireProfile,
  validateRecipientParam,
  handleValidationErrors,
  messageController.getConversationMessages
);

router.post(
  '/',
  authenticate,
  requireProfile,
  validateCreateMessage,
  handleValidationErrors,
  messageController.createMessage
);

export default router;
