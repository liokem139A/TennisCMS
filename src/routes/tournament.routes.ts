/**
 * Tournament API Routes
 * Express.js route handlers for tournament management
 * Author: Backend & Infrastructure Lead
 * Date: 2026-08-24
 * Status: CEL-11 Implementation
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import {
  TournamentService,
  TournamentError,
  InvalidInputError,
  ForbiddenError,
  UnauthorizedError,
  TournamentNotFoundError
} from '../services/tournament.service';
import {
  CreateTournamentRequest,
  UpdateTournamentRequest,
  UpdateTournamentStatusRequest,
  TournamentFilterOptions,
  APIErrorResponse
} from '../types/tournament.types';

/**
 * Create tournament routes
 */
export function createTournamentRoutes(db: Pool): Router {
  const router = Router();
  const service = new TournamentService(db);

  /**
   * Middleware for error handling
   */
  const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof TournamentError) {
      const errorResponse: APIErrorResponse = {
        error: {
          code: err.code,
          message: err.message,
          status: err.statusCode,
          timestamp: new Date().toISOString()
        }
      };
      return res.status(err.statusCode).json(errorResponse);
    }

    if (err instanceof SyntaxError && 'body' in err) {
      const errorResponse: APIErrorResponse = {
        error: {
          code: 'INVALID_JSON',
          message: 'Invalid JSON in request body',
          status: 400,
          timestamp: new Date().toISOString()
        }
      };
      return res.status(400).json(errorResponse);
    }

    console.error('Unhandled error:', err);
    const errorResponse: APIErrorResponse = {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        status: 500,
        timestamp: new Date().toISOString()
      }
    };
    return res.status(500).json(errorResponse);
  };

  /**
   * Middleware for extracting authorization context
   */
  const extractAuthContext = (req: Request, res: Response, next: NextFunction) => {
    // Extract from JWT token (would be done by auth middleware in real implementation)
    (req as any).authContext = {
      userId: (req as any).userId || 'anonymous',
      userRole: (req as any).userRole || 'user',
      permissions: (req as any).permissions || []
    };
    next();
  };

  router.use(extractAuthContext);

  /**
   * POST /api/v1/tournaments
   * Create a new tournament
   */
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request: CreateTournamentRequest = {
        ...req.body,
        organizerId: (req as any).authContext.userId
      };

      const tournament = await service.createTournament(request, (req as any).authContext);

      res.status(201).json(tournament);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/v1/tournaments/:tournamentId
   * Get tournament by ID
   */
  router.get('/:tournamentId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tournamentId } = req.params;
      const tournament = await service.getTournamentWithDetails(tournamentId);

      res.status(200).json(tournament);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/v1/tournaments
   * List tournaments with filters and pagination
   */
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse status filter - can be single or multiple values
      let statusFilter: string[] | undefined;
      if (req.query.status) {
        statusFilter = Array.isArray(req.query.status)
          ? (req.query.status as string[])
          : [req.query.status as string];
      }

      // Parse skill level filter - single value
      const skillLevelFilter = req.query.skillLevel ? (req.query.skillLevel as string) : undefined;

      const filters: TournamentFilterOptions = {
        status: statusFilter as any,
        organizerId: req.query.organizerId as string,
        clubId: req.query.clubId as string,
        skillLevel: skillLevelFilter as any,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        sortBy: (req.query.sortBy as any) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
      };

      if (req.query.startDate_gte) {
        filters.startDate_gte = new Date(req.query.startDate_gte as string);
      }

      if (req.query.startDate_lte) {
        filters.startDate_lte = new Date(req.query.startDate_lte as string);
      }

      const result = await service.listTournaments(filters);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * PATCH /api/v1/tournaments/:tournamentId
   * Update tournament
   */
  router.patch('/:tournamentId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tournamentId } = req.params;
      const request: UpdateTournamentRequest = req.body;

      const tournament = await service.updateTournament(
        tournamentId,
        request,
        (req as any).authContext
      );

      res.status(200).json(tournament);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/v1/tournaments/:tournamentId/status
   * Update tournament status
   */
  router.post('/:tournamentId/status', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tournamentId } = req.params;
      const request: UpdateTournamentStatusRequest = req.body;

      if (!request.status) {
        throw new InvalidInputError('Status is required');
      }

      const tournament = await service.updateTournamentStatus(
        tournamentId,
        request,
        (req as any).authContext
      );

      res.status(200).json(tournament);
    } catch (error) {
      next(error);
    }
  });

  /**
   * DELETE /api/v1/tournaments/:tournamentId
   * Delete tournament (soft delete)
   */
  router.delete('/:tournamentId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tournamentId } = req.params;

      await service.deleteTournament(tournamentId, (req as any).authContext);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  /**
   * Error handling middleware
   */
  router.use(errorHandler);

  return router;
}

/**
 * Health check endpoint
 */
export function createHealthCheckRoute(): Router {
  const router = Router();

  router.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'tournament-api',
      timestamp: new Date().toISOString()
    });
  });

  return router;
}
