import { type Request, type Response, type NextFunction } from 'express';
import { logger } from '@/utils/logger';

interface CustomError extends Error {
  status?: number;
  code?: string;
}

export const errorHandler = (
  error: CustomError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const status = error.status || 500;
  const message = error.message || 'Internal Server Error';
  const code = error.code || 'INTERNAL_ERROR';

  logger.error({
    error: {
      message,
      code,
      status,
      stack: error.stack,
    },
  });

  res.status(status).json({
    error: {
      code,
      message,
      status,
      timestamp: new Date().toISOString(),
    },
  });
};

export class AppError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}
