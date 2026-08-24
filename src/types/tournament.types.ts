/**
 * Tournament Types and Interfaces
 * Author: Backend & Infrastructure Lead
 * Date: 2026-08-24
 * Status: CEL-11 Implementation
 */

/**
 * Tournament Format Types
 */
export enum TournamentFormat {
  SINGLE_ELIMINATION = 'single_elimination',
  DOUBLE_ELIMINATION = 'double_elimination',
  ROUND_ROBIN = 'round_robin',
  SWISS = 'swiss'
}

/**
 * Tournament Status Types
 */
export enum TournamentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * Tournament Surface Types
 */
export enum TournamentSurface {
  HARD = 'hard',
  CLAY = 'clay',
  GRASS = 'grass'
}

/**
 * Skill Level Types
 */
export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  PROFESSIONAL = 'professional'
}

/**
 * Participant Status Types
 */
export enum ParticipantStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  WITHDRAWN = 'withdrawn',
  DISQUALIFIED = 'disqualified'
}

/**
 * Organizer Role Types
 */
export enum OrganizerRole {
  ORGANIZER = 'organizer',
  ADMIN = 'admin',
  REFEREE = 'referee'
}

/**
 * Audit Action Types
 */
export enum AuditAction {
  CREATED = 'created',
  UPDATED = 'updated',
  STATUS_CHANGED = 'status_changed',
  DELETED = 'deleted',
  PARTICIPANT_ADDED = 'participant_added',
  PARTICIPANT_REMOVED = 'participant_removed'
}

/**
 * Tournament Metadata Interface
 */
export interface TournamentMetadata {
  sponsorId?: string;
  prizePool?: number;
  registrationLink?: string;
  rulesDocumentUrl?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

/**
 * Tournament Interface
 */
export interface ITournament {
  id: string;
  name: string;
  description?: string;
  format: TournamentFormat;
  maxParticipants: number;
  currentParticipants: number;
  startDate: Date;
  endDate: Date;
  location?: string;
  surface?: TournamentSurface;
  skillLevel: SkillLevel;
  entryFee?: number;
  currency: string;
  status: TournamentStatus;
  organizerId: string;
  clubId?: string;
  metadata?: TournamentMetadata;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

/**
 * Tournament Participant Interface
 */
export interface ITournamentParticipant {
  id: string;
  tournamentId: string;
  userId: string;
  status: ParticipantStatus;
  joinedAt: Date;
  seedPosition?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tournament Organizer Interface
 */
export interface ITournamentOrganizer {
  id: string;
  tournamentId: string;
  userId: string;
  role: OrganizerRole;
  permissions?: Record<string, boolean>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Audit Log Interface
 */
export interface ITournamentAuditLog {
  id: string;
  tournamentId: string;
  action: AuditAction;
  changedBy: string;
  changes?: Record<string, unknown>;
  previousValues?: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Create Tournament Request DTO
 */
export interface CreateTournamentRequest {
  name: string;
  description?: string;
  format: TournamentFormat;
  maxParticipants: number;
  startDate: string | Date;
  endDate: string | Date;
  location?: string;
  surface?: TournamentSurface;
  skillLevel: SkillLevel;
  entryFee?: number;
  currency?: string;
  organizerId: string;
  clubId?: string;
  metadata?: TournamentMetadata;
}

/**
 * Update Tournament Request DTO
 */
export interface UpdateTournamentRequest {
  name?: string;
  description?: string;
  maxParticipants?: number;
  startDate?: string | Date;
  endDate?: string | Date;
  location?: string;
  entryFee?: number;
  status?: TournamentStatus;
  metadata?: TournamentMetadata;
}

/**
 * Update Tournament Status Request DTO
 */
export interface UpdateTournamentStatusRequest {
  status: TournamentStatus;
}

/**
 * Tournament Response DTO
 */
export interface TournamentResponse extends ITournament {
  participants?: ITournamentParticipant[];
  matches?: unknown[]; // Will be populated from matches service
}

/**
 * Paginated Tournament Response
 */
export interface PaginatedTournamentResponse {
  data: TournamentResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Tournament Query Filter Options
 */
export interface TournamentFilterOptions {
  status?: TournamentStatus | TournamentStatus[];
  organizerId?: string;
  clubId?: string;
  skillLevel?: SkillLevel;
  startDate_gte?: Date;
  startDate_lte?: Date;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'startDate' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Status Transition Validation
 */
export const VALID_STATUS_TRANSITIONS: Record<TournamentStatus, TournamentStatus[]> = {
  [TournamentStatus.DRAFT]: [TournamentStatus.PUBLISHED, TournamentStatus.CANCELLED],
  [TournamentStatus.PUBLISHED]: [TournamentStatus.ACTIVE, TournamentStatus.CANCELLED],
  [TournamentStatus.ACTIVE]: [TournamentStatus.COMPLETED, TournamentStatus.CANCELLED],
  [TournamentStatus.COMPLETED]: [],
  [TournamentStatus.CANCELLED]: []
};

/**
 * Authorization Context
 */
export interface AuthorizationContext {
  userId: string;
  userRole: string;
  permissions: string[];
}

/**
 * API Error Response
 */
export interface APIErrorResponse {
  error: {
    code: string;
    message: string;
    status: number;
    timestamp: string;
    details?: Record<string, unknown>;
  };
}
