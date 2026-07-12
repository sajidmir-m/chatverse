import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

const usernameRules = (field: string) =>
  body(field)
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 2, max: 30 })
    .withMessage('Username must be between 2 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores');

export const validateCreateMessage = [
  body('recipient')
    .trim()
    .notEmpty()
    .withMessage('Recipient is required')
    .isLength({ min: 2, max: 30 })
    .withMessage('Recipient must be between 2 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Recipient can only contain letters, numbers, and underscores'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Message must not exceed 1000 characters'),
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'video'])
    .withMessage('Invalid message type'),
  body('mediaUrl').optional({ nullable: true }).trim().isURL().withMessage('Media URL must be valid'),
];

export const validateCreateProfile = [
  usernameRules('username'),
  body('displayName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Display name must be at most 50 characters'),
  body('bio').optional().trim().isLength({ max: 200 }).withMessage('Bio must be at most 200 characters'),
  body('phone').optional().trim().isLength({ max: 20 }),
  body('avatarUrl').optional({ values: 'null' }).trim(),
];

export const validateUpdateProfile = [
  body('displayName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Display name must be at most 50 characters'),
  body('bio').optional().trim().isLength({ max: 200 }).withMessage('Bio must be at most 200 characters'),
  body('phone').optional().trim().isLength({ max: 20 }),
  body('avatarUrl').optional({ nullable: true }).trim(),
];

export const validateRecipientParam = [
  param('recipient')
    .trim()
    .notEmpty()
    .withMessage('Recipient is required')
    .matches(/^[a-zA-Z0-9_]+$/),
];

export const validateUsernameParam = [
  param('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .matches(/^[a-zA-Z0-9_]+$/),
];

export const validateSearchQuery = [
  query('q')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Search query is too long'),
];

export const validateSendFriendRequest = [
  body('toUsername')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Invalid username'),
];

export const handleValidationErrors = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: 'path' in error ? String(error.path) : 'unknown',
      message: error.msg,
    }));

    next(new AppError('Validation failed', 400, formattedErrors));
    return;
  }

  next();
};
