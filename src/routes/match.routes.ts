/**
 * CEL-13: Match Management & Real-Time Scoring - API Routes
 *
 * Defines all REST API endpoints for match management including:
 * - Match CRUD operations
 * - Score recording
 * - Match actions (start, complete, cancel)
 * - History and statistics endpoints
 */

import express, { Router, Request, Response, NextFunction } from 'express';
import { matchService } from '@/services/match.service';
import { logger } from '@/utils/logger';
import {
  CreateMatchRequest,
  UpdateMatchRequest,
  RecordScoreRequest,
  CompleteSetRequest,
  CompleteMatchRequest,
  CancelMatchRequest,
  MatchFilters,
  PaginationOptions,
  AuthContext,
} from '@/types/match.types';

const router = Router();

/**
 * Middleware: Extract and validate authorization context from JWT
 * TODO: Implement JWT verification
 */
const extractAuthContext = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Extract from Authorization header or session
  // For now, use a test user
  (req as any).authContext = {
    user_id: req.headers['x-user-id'] as string || 'user-test',
    email: req.headers['x-user-email'] as string || 'test@example.com',
    roles: (req.headers['x-user-roles'] as string)?.split(',') || ['player'],
    permissions: [],
  } as AuthContext;
  next();
};

router.use(extractAuthContext);

/**
 * Middleware: Validate pagination parameters
 */
const validatePagination = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

  if (page < 1) {
    _res.status(400).json({
      error: 'INVALID_PAGINATION',
      message: 'page must be >= 1',
    });
    return;
  }

  (req as any).pagination = { page, limit } as PaginationOptions;
  next();
};

/**
 * ==================== MATCH CRUD ENDPOINTS ====================
 */

/**
 * POST /api/v1/matches
 * Create a new match
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('POST /matches', { body: req.body });

    const data: CreateMatchRequest = req.body;

    // Validate required fields
    if (
      !data.tournament_id ||
      !data.player1_id ||
      !data.player2_id ||
      !data.round ||
      !data.scheduled_date ||
      !data.scheduled_time
    ) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Missing required fields',
        required: [
          'tournament_id',
          'player1_id',
          'player2_id',
          'round',
          'scheduled_date',
          'scheduled_time',
        ],
      });
    }

    const authContext = (req as any).authContext as AuthContext;
    const match = await matchService.createMatch(data, authContext);

    res.status(201).json({
      status: 'success',
      code: 201,
      data: match,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/matches/:id
 * Get a specific match by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('GET /matches/:id', { matchId: req.params.id });

    const match = await matchService.getMatchById(req.params.id);

    res.status(200).json({
      status: 'success',
      code: 200,
      data: match,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/matches
 * List matches with filters and pagination
 */
router.get(
  '/',
  validatePagination,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('GET /matches', { query: req.query });

      const filters: MatchFilters = {
        tournament_id: req.query.tournament_id as string,
        player_id: req.query.player_id as string,
        status: req.query.status as any,
        scheduled_date_from: req.query.date_from as string,
        scheduled_date_to: req.query.date_to as string,
        round: req.query.round ? parseInt(req.query.round as string) : undefined,
        court_id: req.query.court_id as string,
      };

      const pagination = (req as any).pagination as PaginationOptions;
      const result = await matchService.listMatches(filters, pagination);

      res.status(200).json({
        status: 'success',
        code: 200,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/matches/:id
 * Update match details
 */
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('PATCH /matches/:id', { matchId: req.params.id, body: req.body });

    const data: UpdateMatchRequest = req.body;
    const authContext = (req as any).authContext as AuthContext;

    const match = await matchService.updateMatch(
      req.params.id,
      data,
      authContext
    );

    res.status(200).json({
      status: 'success',
      code: 200,
      data: match,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/matches/:id
 * Delete match (soft delete)
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('DELETE /matches/:id', { matchId: req.params.id });

    const authContext = (req as any).authContext as AuthContext;
    await matchService.deleteMatch(req.params.id, authContext);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * ==================== MATCH ACTION ENDPOINTS ====================
 */

/**
 * POST /api/v1/matches/:id/start
 * Start a match
 */
router.post('/:id/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('POST /matches/:id/start', { matchId: req.params.id });

    const authContext = (req as any).authContext as AuthContext;
    const match = await matchService.startMatch(req.params.id, authContext);

    res.status(200).json({
      status: 'success',
      code: 200,
      data: match,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/matches/:id/complete
 * Complete a match
 */
router.post('/:id/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('POST /matches/:id/complete', {
      matchId: req.params.id,
      body: req.body,
    });

    if (!req.body.winner_id) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'winner_id is required',
      });
    }

    const data: CompleteMatchRequest = req.body;
    const authContext = (req as any).authContext as AuthContext;
    const match = await matchService.completeMatch(
      req.params.id,
      data,
      authContext
    );

    res.status(200).json({
      status: 'success',
      code: 200,
      data: match,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/matches/:id/cancel
 * Cancel a match
 */
router.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('POST /matches/:id/cancel', {
      matchId: req.params.id,
      body: req.body,
    });

    if (!req.body.reason) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'reason is required',
      });
    }

    const data: CancelMatchRequest = req.body;
    const authContext = (req as any).authContext as AuthContext;
    const match = await matchService.cancelMatch(
      req.params.id,
      data,
      authContext
    );

    res.status(200).json({
      status: 'success',
      code: 200,
      data: match,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * ==================== SCORE RECORDING ENDPOINTS ====================
 */

/**
 * PATCH /api/v1/matches/:id/score
 * Record score update for a set
 */
router.patch('/:id/score', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('PATCH /matches/:id/score', {
      matchId: req.params.id,
      body: req.body,
    });

    const required = ['set_number', 'player1_games', 'player2_games'];
    const missing = required.filter((field) => !(field in req.body));

    if (missing.length > 0) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Missing required fields',
        missing,
      });
    }

    const data: RecordScoreRequest = req.body;
    const authContext = (req as any).authContext as AuthContext;

    const match = await matchService.recordScore(
      req.params.id,
      data,
      authContext
    );

    res.status(200).json({
      status: 'success',
      code: 200,
      data: match,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/matches/:id/sets/:setNumber/complete
 * Complete a set
 */
router.post(
  '/:id/sets/:setNumber/complete',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('POST /matches/:id/sets/:setNumber/complete', {
        matchId: req.params.id,
        setNumber: req.params.setNumber,
        body: req.body,
      });

      if (!req.body.winner_id) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'winner_id is required',
        });
      }

      const data: CompleteSetRequest = {
        set_number: parseInt(req.params.setNumber),
        winner_id: req.body.winner_id,
      };

      const authContext = (req as any).authContext as AuthContext;
      const match = await matchService.completeSet(
        req.params.id,
        data,
        authContext
      );

      res.status(200).json({
        status: 'success',
        code: 200,
        data: match,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * ==================== HISTORY & STATS ENDPOINTS ====================
 */

/**
 * GET /api/v1/matches/:id/history
 * Get match history/timeline
 */
router.get(
  '/:id/history',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('GET /matches/:id/history', { matchId: req.params.id });

      const history = await matchService.getMatchHistory(req.params.id);

      res.status(200).json({
        status: 'success',
        code: 200,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/players/:playerId/matches
 * Get player's match history
 */
router.get(
  '/players/:playerId/matches',
  validatePagination,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('GET /players/:playerId/matches', {
        playerId: req.params.playerId,
        query: req.query,
      });

      const filters = {
        status: req.query.status as any,
        tournament_id: req.query.tournament_id as string,
        date_from: req.query.date_from as string,
        date_to: req.query.date_to as string,
        opponent_id: req.query.opponent_id as string,
      };

      const pagination = (req as any).pagination as PaginationOptions;
      const result = await matchService.getPlayerMatches(
        req.params.playerId,
        filters,
        pagination
      );

      res.status(200).json({
        status: 'success',
        code: 200,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/players/:playerId/tournaments/:tournamentId/statistics
 * Get player statistics for a tournament
 */
router.get(
  '/players/:playerId/tournaments/:tournamentId/statistics',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('GET /players/:playerId/tournaments/:tournamentId/statistics', {
        playerId: req.params.playerId,
        tournamentId: req.params.tournamentId,
      });

      const stats = await matchService.getPlayerStatistics(
        req.params.playerId,
        req.params.tournamentId
      );

      res.status(200).json({
        status: 'success',
        code: 200,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Health check endpoint for match service
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'match-api',
    timestamp: new Date().toISOString(),
  });
});

export default router;
