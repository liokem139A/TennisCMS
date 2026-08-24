import { type Request, type Response, type NextFunction } from 'express';
import { v4 as uuidv4 } from 'crypto';
import { logger } from '@/utils/logger';

export const requestLogger = (req: Request, _res: Response, next: NextFunction): void => {
  const requestId = req.get('X-Request-ID') || uuidv4();
  req.id = requestId;

  logger.info({
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
  });

  next();
};

// Extend Express Request type to include requestId
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}
