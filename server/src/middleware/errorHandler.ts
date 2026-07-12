import { ApiError } from '../types';

export class AppError extends Error implements ApiError {
  statusCode: number;
  errors?: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    statusCode = 500,
    errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFoundHandler = (_req: unknown, _res: unknown, next: (err: AppError) => void): void => {
  next(new AppError('Resource not found', 404));
};

export const errorHandler = (
  err: AppError | Error,
  _req: unknown,
  res: {
    status: (code: number) => { json: (body: unknown) => void };
  },
  _next: unknown
): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal server error';

  if (process.env.NODE_ENV !== 'production') {
    console.error('[Error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: err instanceof AppError ? err.errors : undefined,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
