/**
 * CEL-13: Match Management & Real-Time Scoring - WebSocket Service
 *
 * Manages real-time WebSocket connections for live match updates.
 * Features:
 * - Multiple client subscriptions per match
 * - Redis pub/sub for multi-instance support
 * - Automatic reconnection handling
 * - Heartbeat/keep-alive mechanism
 * - Rate limiting per match (max 10 updates/second)
 */

import { WebSocket, WebSocketServer, RawData } from 'ws';
import { createServer } from 'http';
import { logger } from '@/utils/logger';
import {
  WebSocketMessage,
  WebSocketEventType,
  ScoreUpdateMessage,
  SetCompletedMessage,
  MatchCompletedMessage,
  StatusChangedMessage,
  MatchStartedMessage,
  ErrorMessage,
  MatchStatus,
} from '@/types/match.types';
import type Redis from 'ioredis';

/**
 * Client subscription tracking
 */
interface ClientSubscription {
  matchId: string;
  userId: string;
  connectedAt: Date;
}

/**
 * Rate limit tracking
 */
interface RateLimitBucket {
  count: number;
  resetTime: number;
}

/**
 * WebSocket Service for Real-Time Match Updates
 */
export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, ClientSubscription> = new Map();
  private matchSubscriptions: Map<string, Set<WebSocket>> = new Map();
  private rateLimits: Map<string, RateLimitBucket> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private redis: Redis | null = null;

  // Configuration
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly RATE_LIMIT_WINDOW = 1000; // 1 second
  private readonly RATE_LIMIT_MAX = 10; // max updates per second per match
  private readonly MESSAGE_QUEUE_SIZE = 100;

  /**
   * Initialize WebSocket server
   * Attach to existing HTTP server for socket.io compatibility
   */
  public initialize(httpServer: any, redisClient?: Redis): void {
    logger.info('Initializing WebSocket server');

    this.wss = new WebSocketServer({ server: httpServer });
    this.redis = redisClient || null;

    this.wss.on('connection', (ws: WebSocket, req: any) => {
      this.handleNewConnection(ws, req);
    });

    // Start heartbeat
    this.startHeartbeat();

    logger.info('WebSocket server initialized');
  }

  /**
   * Handle new WebSocket connection
   * Expected URL: /api/v1/matches/:id/live?userId=...
   */
  private handleNewConnection(ws: WebSocket, req: any): void {
    const url = new URL(req.url || '', 'ws://localhost');
    const pathParts = url.pathname.split('/');
    const matchId = pathParts[pathParts.length - 2];
    const userId = url.searchParams.get('userId') || 'anonymous';

    logger.info('New WebSocket connection', { matchId, userId });

    // Validate match ID
    if (!matchId || matchId === 'live') {
      ws.close(1008, 'Invalid match ID');
      return;
    }

    // Register client
    const subscription: ClientSubscription = {
      matchId,
      userId,
      connectedAt: new Date(),
    };
    this.clients.set(ws, subscription);

    // Add to match subscriptions
    if (!this.matchSubscriptions.has(matchId)) {
      this.matchSubscriptions.set(matchId, new Set());
    }
    this.matchSubscriptions.get(matchId)!.add(ws);

    logger.info('Client subscribed to match', { matchId, userId });

    // Send welcome message
    this.sendMessage(ws, {
      type: WebSocketEventType.HEARTBEAT,
      data: {
        timestamp: new Date().toISOString(),
      },
    });

    // Handle messages from client
    ws.on('message', (data: RawData) => {
      this.handleClientMessage(ws, data);
    });

    // Handle client disconnect
    ws.on('close', () => {
      this.handleClientDisconnect(ws);
    });

    // Handle errors
    ws.on('error', (error: Error) => {
      logger.error('WebSocket error', { matchId, userId, error: error.message });
      this.sendError(ws, 'WS_ERROR', 'WebSocket error occurred');
    });
  }

  /**
   * Handle message from client
   * TODO: Implement client-to-server messages (e.g., ping/pong)
   */
  private handleClientMessage(ws: WebSocket, data: RawData): void {
    try {
      const subscription = this.clients.get(ws);
      if (!subscription) return;

      const message = JSON.parse(data.toString());
      logger.debug('Received client message', {
        matchId: subscription.matchId,
        messageType: message.type,
      });

      // TODO: Handle different message types
      // - heartbeat/pong for keep-alive
      // - subscription management
      // - etc.
    } catch (error) {
      logger.error('Error parsing client message', { error });
      this.sendError(ws, 'INVALID_MESSAGE', 'Failed to parse message');
    }
  }

  /**
   * Handle client disconnect
   */
  private handleClientDisconnect(ws: WebSocket): void {
    const subscription = this.clients.get(ws);
    if (!subscription) return;

    logger.info('Client disconnected', {
      matchId: subscription.matchId,
      userId: subscription.userId,
    });

    // Remove from match subscriptions
    const matchClients = this.matchSubscriptions.get(subscription.matchId);
    if (matchClients) {
      matchClients.delete(ws);
      if (matchClients.size === 0) {
        this.matchSubscriptions.delete(subscription.matchId);
      }
    }

    // Remove client
    this.clients.delete(ws);
  }

  /**
   * Broadcast score update to all match watchers
   */
  public broadcastScoreUpdate(
    matchId: string,
    setNumber: number,
    player1Games: number,
    player2Games: number,
    isTiebreak: boolean = false,
    tiebreakP1?: number,
    tiebreakP2?: number
  ): void {
    if (!this.checkRateLimit(matchId)) {
      logger.warn('Score update rate limit exceeded', { matchId });
      return;
    }

    const message: ScoreUpdateMessage = {
      type: WebSocketEventType.SCORE_UPDATED,
      data: {
        match_id: matchId,
        set_number: setNumber,
        player1_games: player1Games,
        player2_games: player2Games,
        is_tiebreak: isTiebreak,
        tiebreak_player1_points: tiebreakP1,
        tiebreak_player2_points: tiebreakP2,
        updated_at: new Date().toISOString(),
      },
    };

    this.broadcastToMatch(matchId, message);

    // Publish to Redis for multi-instance support
    if (this.redis) {
      this.redis.publish(
        `match:${matchId}:score`,
        JSON.stringify(message)
      ).catch((err) => logger.error('Redis publish error', { error: err }));
    }
  }

  /**
   * Broadcast set completion
   */
  public broadcastSetCompleted(
    matchId: string,
    setNumber: number,
    winnerId: string,
    player1Games: number,
    player2Games: number,
    nextSet?: number
  ): void {
    const message: SetCompletedMessage = {
      type: WebSocketEventType.SET_COMPLETED,
      data: {
        match_id: matchId,
        set_number: setNumber,
        winner_id: winnerId,
        player1_games: player1Games,
        player2_games: player2Games,
        next_set: nextSet,
      },
    };

    this.broadcastToMatch(matchId, message);

    if (this.redis) {
      this.redis.publish(
        `match:${matchId}:set-completed`,
        JSON.stringify(message)
      ).catch((err) => logger.error('Redis publish error', { error: err }));
    }
  }

  /**
   * Broadcast match completion
   */
  public broadcastMatchCompleted(
    matchId: string,
    winnerId: string,
    setsWonP1: number,
    setsWonP2: number,
    durationMinutes: number
  ): void {
    const message: MatchCompletedMessage = {
      type: WebSocketEventType.MATCH_COMPLETED,
      data: {
        match_id: matchId,
        winner_id: winnerId,
        sets_won_player1: setsWonP1,
        sets_won_player2: setsWonP2,
        duration_minutes: durationMinutes,
        completed_at: new Date().toISOString(),
      },
    };

    this.broadcastToMatch(matchId, message);

    if (this.redis) {
      this.redis.publish(
        `match:${matchId}:completed`,
        JSON.stringify(message)
      ).catch((err) => logger.error('Redis publish error', { error: err }));
    }
  }

  /**
   * Broadcast status change
   */
  public broadcastStatusChange(
    matchId: string,
    oldStatus: MatchStatus,
    newStatus: MatchStatus,
    reason?: string
  ): void {
    const message: StatusChangedMessage = {
      type: WebSocketEventType.STATUS_CHANGED,
      data: {
        match_id: matchId,
        old_status: oldStatus,
        new_status: newStatus,
        changed_at: new Date().toISOString(),
        reason,
      },
    };

    this.broadcastToMatch(matchId, message);

    if (this.redis) {
      this.redis.publish(
        `match:${matchId}:status`,
        JSON.stringify(message)
      ).catch((err) => logger.error('Redis publish error', { error: err }));
    }
  }

  /**
   * Broadcast match started
   */
  public broadcastMatchStarted(matchId: string): void {
    const message: MatchStartedMessage = {
      type: WebSocketEventType.MATCH_STARTED,
      data: {
        match_id: matchId,
        started_at: new Date().toISOString(),
      },
    };

    this.broadcastToMatch(matchId, message);

    if (this.redis) {
      this.redis.publish(
        `match:${matchId}:started`,
        JSON.stringify(message)
      ).catch((err) => logger.error('Redis publish error', { error: err }));
    }
  }

  /**
   * Get active subscriptions count for a match
   */
  public getMatchSubscriberCount(matchId: string): number {
    return this.matchSubscriptions.get(matchId)?.size || 0;
  }

  /**
   * Shutdown WebSocket service
   */
  public shutdown(): void {
    logger.info('Shutting down WebSocket service');

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.wss) {
      this.wss.close();
    }
  }

  /**
   * ==================== PRIVATE HELPER METHODS ====================
   */

  /**
   * Broadcast message to all subscribers of a match
   */
  private broadcastToMatch(matchId: string, message: WebSocketMessage): void {
    const clients = this.matchSubscriptions.get(matchId);
    if (!clients || clients.size === 0) {
      return;
    }

    const data = JSON.stringify(message);
    let successCount = 0;
    let errorCount = 0;

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(data);
          successCount++;
        } catch (error) {
          logger.error('Failed to send message', { error, matchId });
          errorCount++;
        }
      }
    });

    if (errorCount > 0) {
      logger.warn('Failed to broadcast to some clients', {
        matchId,
        successCount,
        errorCount,
      });
    }
  }

  /**
   * Send message to single client
   */
  private sendMessage(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error('Failed to send message to client', { error });
      }
    }
  }

  /**
   * Send error message to client
   */
  private sendError(ws: WebSocket, code: string, message: string): void {
    const errorMessage: ErrorMessage = {
      type: WebSocketEventType.ERROR,
      data: {
        code,
        message,
      },
    };
    this.sendMessage(ws, errorMessage);
  }

  /**
   * Check and enforce rate limit for match
   * Max 10 updates per second per match
   */
  private checkRateLimit(matchId: string): boolean {
    const now = Date.now();
    let bucket = this.rateLimits.get(matchId);

    if (!bucket || now > bucket.resetTime) {
      // New window
      this.rateLimits.set(matchId, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW,
      });
      return true;
    }

    // Check if under limit
    if (bucket.count < this.RATE_LIMIT_MAX) {
      bucket.count++;
      return true;
    }

    return false;
  }

  /**
   * Send heartbeat to all connected clients
   * Keeps connections alive through proxies and firewalls
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const timestamp = new Date().toISOString();
      const heartbeatMessage = {
        type: WebSocketEventType.HEARTBEAT,
        data: { timestamp },
      };
      const data = JSON.stringify(heartbeatMessage);

      this.clients.forEach((_, client) => {
        if (client.readyState === WebSocket.OPEN) {
          try {
            client.send(data);
          } catch (error) {
            logger.error('Failed to send heartbeat', { error });
          }
        }
      });
    }, this.HEARTBEAT_INTERVAL);
  }
}

/**
 * Export singleton instance
 */
export const wsService = new WebSocketService();
