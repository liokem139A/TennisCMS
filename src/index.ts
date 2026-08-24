import 'express-async-errors';
import express, { type Application, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/errorHandler';
import { requestLogger } from '@/middleware/requestLogger';

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: config.cors.origin }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(
  pinoHttp({
    logger: logger,
    autoLogging: {
      ignore: (req) => req.path === '/health',
    },
  })
);
app.use(requestLogger);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API version info
app.get('/api/v1', (_req: Request, res: Response) => {
  res.json({
    name: 'Tennis CMS API',
    version: '1.0.0',
    environment: config.env,
    timestamp: new Date().toISOString(),
  });
});

// Routes
import matchRoutes from '@/routes/match.routes';

// Mount API routes
app.use('/api/v1/matches', matchRoutes);
// TODO: Mount additional routes
// app.use('/api/v1/clubs', clubRoutes);
// app.use('/api/v1/tournaments', tournamentRoutes);
// app.use('/api/v1/users', userRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist',
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.port;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${config.env} mode`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Handle unhandled exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
