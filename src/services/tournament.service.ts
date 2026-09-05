/**
 * Tournament Service
 * Business logic layer for tournament management
 * Author: Backend & Infrastructure Lead
 * Date: 2026-08-24
 * Status: CEL-11 Implementation
 */

import { Pool, QueryResult } from 'pg';
import {
  ITournament,
  TournamentStatus,
  CreateTournamentRequest,
  UpdateTournamentRequest,
  UpdateTournamentStatusRequest,
  TournamentResponse,
  PaginatedTournamentResponse,
  TournamentFilterOptions,
  VALID_STATUS_TRANSITIONS,
  AuditAction,
  ParticipantStatus,
  AuthorizationContext
} from '../types/tournament.types';

/**
 * Custom Error Classes
 */
export class TournamentError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'TournamentError';
  }
}

export class TournamentNotFoundError extends TournamentError {
  constructor(tournamentId: string) {
    super('TOURNAMENT_NOT_FOUND', 404, `Tournament with ID ${tournamentId} does not exist`);
  }
}

export class UnauthorizedError extends TournamentError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', 401, message);
  }
}

export class ForbiddenError extends TournamentError {
  constructor(message: string = 'Access denied') {
    super('FORBIDDEN', 403, message);
  }
}

export class InvalidInputError extends TournamentError {
  constructor(message: string) {
    super('INVALID_INPUT', 400, message);
  }
}

export class ConflictError extends TournamentError {
  constructor(code: string, message: string) {
    super(code, 409, message);
  }
}

/**
 * Tournament Service Class
 */
export class TournamentService {
  constructor(private db: Pool) {}

  /**
   * Create a new tournament
   */
  async createTournament(
    request: CreateTournamentRequest,
    context: AuthorizationContext
  ): Promise<ITournament> {
    // Validate authorization
    if (!this.isOrganizer(context)) {
      throw new UnauthorizedError('User must have organizer role to create tournaments');
    }

    // Validate input
    this.validateTournamentInput(request);

    // Ensure dates are parsed
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);

    // Validate date logic
    if (endDate <= startDate) {
      throw new InvalidInputError('End date must be after start date');
    }

    if (startDate < new Date()) {
      throw new InvalidInputError('Start date must be in the future');
    }

    if (request.maxParticipants <= 0) {
      throw new InvalidInputError('Max participants must be greater than 0');
    }

    const query = `
      INSERT INTO tournaments (
        name, description, format, max_participants, start_date, end_date,
        location, surface, skill_level, entry_fee, currency, status,
        organizer_id, club_id, metadata, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()
      ) RETURNING *;
    `;

    const values = [
      request.name,
      request.description || null,
      request.format,
      request.maxParticipants,
      startDate,
      endDate,
      request.location || null,
      request.surface || null,
      request.skillLevel,
      request.entryFee || null,
      request.currency || 'USD',
      'draft',
      request.organizerId,
      request.clubId || null,
      request.metadata ? JSON.stringify(request.metadata) : null
    ];

    try {
      const result = await this.db.query(query, values);
      await this.logAuditEvent(result.rows[0].id, AuditAction.CREATED, context.userId, {}, {});
      return this.mapToTournament(result.rows[0]);
    } catch (error) {
      if ((error as any).code === '23505') { // Unique constraint violation
        throw new ConflictError('TOURNAMENT_ALREADY_EXISTS', 'Tournament with this name already exists for this organizer');
      }
      throw error;
    }
  }

  /**
   * Get tournament by ID
   */
  async getTournamentById(tournamentId: string): Promise<ITournament> {
    const query = `
      SELECT * FROM tournaments
      WHERE id = $1 AND deleted_at IS NULL;
    `;

    const result = await this.db.query(query, [tournamentId]);

    if (result.rows.length === 0) {
      throw new TournamentNotFoundError(tournamentId);
    }

    return this.mapToTournament(result.rows[0]);
  }

  /**
   * Get tournament with full details (participants, matches, etc)
   */
  async getTournamentWithDetails(tournamentId: string): Promise<TournamentResponse> {
    const tournament = await this.getTournamentById(tournamentId);

    // Get participants
    const participantsQuery = `
      SELECT * FROM tournament_participants
      WHERE tournament_id = $1
      ORDER BY joined_at DESC;
    `;
    const participantsResult = await this.db.query(participantsQuery, [tournamentId]);

    return {
      ...tournament,
      participants: participantsResult.rows.map(row => this.mapToParticipant(row))
    };
  }

  /**
   * List tournaments with filters and pagination
   */
  async listTournaments(filters: TournamentFilterOptions): Promise<PaginatedTournamentResponse> {
    // Build WHERE clause
    const whereConditions: string[] = ['tournaments.deleted_at IS NULL'];
    const params: unknown[] = [];
    let paramCount = 1;

    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      whereConditions.push(`tournaments.status IN (${statuses.map(() => `$${paramCount++}`).join(', ')})`);
      params.push(...statuses);
    }

    if (filters.organizerId) {
      whereConditions.push(`tournaments.organizer_id = $${paramCount++}`);
      params.push(filters.organizerId);
    }

    if (filters.clubId) {
      whereConditions.push(`tournaments.club_id = $${paramCount++}`);
      params.push(filters.clubId);
    }

    if (filters.skillLevel) {
      whereConditions.push(`tournaments.skill_level = $${paramCount++}`);
      params.push(filters.skillLevel);
    }

    if (filters.startDate_gte) {
      whereConditions.push(`tournaments.start_date >= $${paramCount++}`);
      params.push(filters.startDate_gte);
    }

    if (filters.startDate_lte) {
      whereConditions.push(`tournaments.start_date <= $${paramCount++}`);
      params.push(filters.startDate_lte);
    }

    if (filters.search) {
      whereConditions.push(`tournaments.name ILIKE $${paramCount++}`);
      params.push(`%${filters.search}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Pagination
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const offset = (page - 1) * limit;

    // Sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    const validSortFields = ['name', 'start_date', 'created_at', 'updated_at'];

    if (!validSortFields.includes(sortBy)) {
      throw new InvalidInputError(`Invalid sort field: ${sortBy}`);
    }

    if (!['asc', 'desc'].includes(sortOrder)) {
      throw new InvalidInputError(`Invalid sort order: ${sortOrder}`);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM tournaments WHERE ${whereClause};`;
    const countResult = await this.db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated results
    const dataQuery = `
      SELECT * FROM tournaments
      WHERE ${whereClause}
      ORDER BY tournaments.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2};
    `;

    const dataParams = [...params, limit, offset];
    const dataResult = await this.db.query(dataQuery, dataParams);

    return {
      data: dataResult.rows.map(row => this.mapToTournament(row)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update tournament
   */
  async updateTournament(
    tournamentId: string,
    request: UpdateTournamentRequest,
    context: AuthorizationContext
  ): Promise<ITournament> {
    // Get current tournament
    const current = await this.getTournamentById(tournamentId);

    // Check authorization
    if (!this.canModifyTournament(current, context)) {
      throw new ForbiddenError('You do not have permission to modify this tournament');
    }

    // Check status constraints
    if (current.status !== TournamentStatus.DRAFT) {
      const restrictedFields = ['format', 'skillLevel', 'maxParticipants', 'surface'];
      for (const field of restrictedFields) {
        if ((request as any)[field] !== undefined) {
          throw new ConflictError(
            'TOURNAMENT_LOCKED',
            `Cannot modify ${field} after tournament is published`
          );
        }
      }
    }

    // Validate input if provided
    if (request.name || request.maxParticipants || request.startDate || request.endDate) {
      this.validateTournamentUpdate(request, current);
    }

    // Build update query
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (request.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(request.name);
    }

    if (request.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(request.description || null);
    }

    if (request.maxParticipants !== undefined) {
      updates.push(`max_participants = $${paramCount++}`);
      values.push(request.maxParticipants);
    }

    if (request.startDate !== undefined) {
      updates.push(`start_date = $${paramCount++}`);
      values.push(new Date(request.startDate));
    }

    if (request.endDate !== undefined) {
      updates.push(`end_date = $${paramCount++}`);
      values.push(new Date(request.endDate));
    }

    if (request.location !== undefined) {
      updates.push(`location = $${paramCount++}`);
      values.push(request.location || null);
    }

    if (request.entryFee !== undefined) {
      updates.push(`entry_fee = $${paramCount++}`);
      values.push(request.entryFee || null);
    }

    if (request.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(request.status);
    }

    if (request.metadata !== undefined) {
      updates.push(`metadata = $${paramCount++}`);
      values.push(JSON.stringify(request.metadata));
    }

    if (updates.length === 0) {
      return current;
    }

    updates.push(`updated_at = NOW()`);
    values.push(tournamentId);

    const query = `
      UPDATE tournaments
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *;
    `;

    const result = await this.db.query(query, values);
    const updated = this.mapToTournament(result.rows[0]);
    await this.logAuditEvent(
      tournamentId,
      AuditAction.UPDATED,
      context.userId,
      this.extractChanges(request),
      this.extractPreviousValues(current)
    );
    return updated;
  }

  /**
   * Update tournament status
   */
  async updateTournamentStatus(
    tournamentId: string,
    request: UpdateTournamentStatusRequest,
    context: AuthorizationContext
  ): Promise<ITournament> {
    const tournament = await this.getTournamentById(tournamentId);

    // Check authorization
    if (!this.canModifyTournament(tournament, context)) {
      throw new ForbiddenError('You do not have permission to modify this tournament');
    }

    // Validate status transition
    const validTransitions = VALID_STATUS_TRANSITIONS[tournament.status];
    if (!validTransitions.includes(request.status)) {
      throw new ConflictError(
        'INVALID_STATUS_TRANSITION',
        `Cannot transition from ${tournament.status} to ${request.status}`
      );
    }

    // Validate business rules for specific transitions
    if (request.status === TournamentStatus.PUBLISHED) {
      await this.validatePublishTransition(tournament);
    }

    if (request.status === TournamentStatus.ACTIVE) {
      await this.validateActivateTransition(tournament);
    }

    const query = `
      UPDATE tournaments
      SET status = $1, updated_at = NOW()
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING *;
    `;

    const result = await this.db.query(query, [request.status, tournamentId]);

    if (result.rows.length === 0) {
      throw new TournamentNotFoundError(tournamentId);
    }

    const updated = this.mapToTournament(result.rows[0]);
    await this.logAuditEvent(
      tournamentId,
      AuditAction.STATUS_CHANGED,
      context.userId,
      { newStatus: request.status },
      { previousStatus: tournament.status }
    );

    return updated;
  }

  /**
   * Delete tournament (soft delete)
   */
  async deleteTournament(
    tournamentId: string,
    context: AuthorizationContext
  ): Promise<void> {
    const tournament = await this.getTournamentById(tournamentId);

    // Check authorization
    if (!this.canModifyTournament(tournament, context)) {
      throw new ForbiddenError('You do not have permission to delete this tournament');
    }

    // Validate deletion constraints
    if (tournament.status !== TournamentStatus.DRAFT && tournament.status !== TournamentStatus.PUBLISHED) {
      throw new ConflictError(
        'TOURNAMENT_LOCKED',
        `Cannot delete tournament with status ${tournament.status}`
      );
    }

    const query = `
      UPDATE tournaments
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;

    const result = await this.db.query(query, [tournamentId]);

    if (result.rows.length === 0) {
      throw new TournamentNotFoundError(tournamentId);
    }

    await this.logAuditEvent(
      tournamentId,
      AuditAction.DELETED,
      context.userId,
      {},
      this.extractPreviousValues(tournament)
    );
  }

  /**
   * Helper Methods
   */

  private isOrganizer(context: AuthorizationContext): boolean {
    return context.userRole === 'organizer' || context.userRole === 'admin';
  }

  private canModifyTournament(tournament: ITournament, context: AuthorizationContext): boolean {
    return tournament.organizerId === context.userId || context.userRole === 'admin';
  }

  private validateTournamentInput(request: CreateTournamentRequest): void {
    if (!request.name || request.name.length < 3 || request.name.length > 255) {
      throw new InvalidInputError('Tournament name must be between 3 and 255 characters');
    }

    if (!request.format) {
      throw new InvalidInputError('Tournament format is required');
    }

    if (!request.maxParticipants || request.maxParticipants <= 0) {
      throw new InvalidInputError('Max participants must be a positive integer');
    }

    if (!request.skillLevel) {
      throw new InvalidInputError('Skill level is required');
    }

    if (request.entryFee !== undefined && request.entryFee < 0) {
      throw new InvalidInputError('Entry fee cannot be negative');
    }
  }

  private validateTournamentUpdate(request: UpdateTournamentRequest, current: ITournament): void {
    if (request.name !== undefined && (request.name.length < 3 || request.name.length > 255)) {
      throw new InvalidInputError('Tournament name must be between 3 and 255 characters');
    }

    if (request.maxParticipants !== undefined && request.maxParticipants <= 0) {
      throw new InvalidInputError('Max participants must be a positive integer');
    }

    if (request.entryFee !== undefined && request.entryFee < 0) {
      throw new InvalidInputError('Entry fee cannot be negative');
    }

    const startDate = request.startDate ? new Date(request.startDate) : current.startDate;
    const endDate = request.endDate ? new Date(request.endDate) : current.endDate;

    if (endDate <= startDate) {
      throw new InvalidInputError('End date must be after start date');
    }
  }

  private async validatePublishTransition(tournament: ITournament): Promise<void> {
    // Require minimum participants for publication
    const participantsQuery = `
      SELECT COUNT(*) as count FROM tournament_participants
      WHERE tournament_id = $1 AND status = $2;
    `;

    const result = await this.db.query(participantsQuery, [tournament.id, ParticipantStatus.CONFIRMED]);
    const confirmedCount = parseInt(result.rows[0].count, 10);

    if (confirmedCount < 2) {
      throw new ConflictError(
        'INSUFFICIENT_PARTICIPANTS',
        'Tournament must have at least 2 confirmed participants to be published'
      );
    }
  }

  private async validateActivateTransition(tournament: ITournament): Promise<void> {
    // Validate that tournament start time has been reached
    if (new Date() < tournament.startDate) {
      throw new ConflictError(
        'TOURNAMENT_NOT_STARTED',
        'Tournament start time has not been reached'
      );
    }
  }

  private mapToTournament(row: any): ITournament {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      format: row.format,
      maxParticipants: row.max_participants,
      currentParticipants: row.current_participants,
      startDate: row.start_date,
      endDate: row.end_date,
      location: row.location,
      surface: row.surface,
      skillLevel: row.skill_level,
      entryFee: row.entry_fee,
      currency: row.currency,
      status: row.status,
      organizerId: row.organizer_id,
      clubId: row.club_id,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at
    };
  }

  private mapToParticipant(row: any) {
    return {
      id: row.id,
      tournamentId: row.tournament_id,
      userId: row.user_id,
      status: row.status,
      joinedAt: row.joined_at,
      seedPosition: row.seed_position,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private extractChanges(request: any): Record<string, unknown> {
    const changes: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(request)) {
      if (value !== undefined) {
        changes[key] = value;
      }
    }
    return changes;
  }

  private extractPreviousValues(tournament: ITournament): Record<string, unknown> {
    return {
      name: tournament.name,
      status: tournament.status,
      maxParticipants: tournament.maxParticipants
    };
  }

  private async logAuditEvent(
    tournamentId: string,
    action: AuditAction,
    changedBy: string,
    changes: Record<string, unknown>,
    previousValues: Record<string, unknown>
  ): Promise<void> {
    const query = `
      INSERT INTO tournament_audit_log (tournament_id, action, changed_by, changes, previous_values, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW());
    `;

    try {
      await this.db.query(query, [
        tournamentId,
        action,
        changedBy,
        JSON.stringify(changes),
        JSON.stringify(previousValues)
      ]);
    } catch (error) {
      // Log audit failures but don't fail the main operation
      console.error('Failed to log audit event:', error);
    }
  }
}
