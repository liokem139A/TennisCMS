import { type RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger';

export const requestLogger: RequestHandler = (req, _res, next): void => {
  const requestId = req.get('X-Request-ID') || uuidv4();
  (req as any).id = requestId;

  logger.info({
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
  });

  next();
};
