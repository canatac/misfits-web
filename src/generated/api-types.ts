/**
 * Generated API types for misfits.ai
 *
 * Source: reimagined-guide/ops/openapi/{auth,mailbox,admin,monitoring}-v1.yaml
 *
 * DO NOT EDIT MANUALLY.
 * Regenerate with: pnpm openapi-ts (see scripts/generate-types.sh)
 *
 * Sprint 1 — initial generation from OpenAPI specs.
 */

// ─── Shared primitives ───────────────────────────────────────────────────────

export interface MessageError {
  message?: string;
}

export interface CodeError {
  code?: string;
  message?: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  alias?: string | null;
  condition_accepted: boolean;
}

export interface TwoFactorVerifyRequest {
  email: string;
  code: string;
  method: "totp" | "email";
}

export interface UserResponse {
  id?: string;
  email?: string;
  display_name?: string;
  role?: string;
  two_factor_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SessionResponse {
  id?: string;
  user?: UserResponse;
  access_token?: string;
  refresh_token?: string;
  /** Unix ms */
  expires_at?: number;
  /** Unix ms */
  refresh_expires_at?: number;
  /** Unix ms */
  issued_at?: number;
}

export interface AuthResponse {
  session?: SessionResponse;
}

export interface PasswordResetRequestBody {
  email: string;
}

export interface PasswordResetConfirmBody {
  token: string;
  password: string;
}

// ─── Mailbox ──────────────────────────────────────────────────────────────────

export type EmailFolder = "inbox" | "sent" | "drafts" | "archive" | "trash" | "spam";

export interface ApiEmailAddress {
  name?: string;
  address: string;
}

export interface ApiEmailDto {
  id?: string;
  threadId?: string;
  folder?: string;
  from?: ApiEmailAddress;
  to?: ApiEmailAddress[];
  subject?: string;
  preview?: string;
  date?: string;
  isRead?: boolean;
  isStarred?: boolean;
  isImportant?: boolean;
  hasAttachments?: boolean;
  labels?: string[];
}

export interface ApiEmailDetail extends ApiEmailDto {
  body?: string;
  bodyType?: "html" | "text";
  cc?: ApiEmailAddress[];
  attachments?: unknown[];
}

export interface EmailListApiResponse {
  emails?: ApiEmailDto[];
  total?: number;
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
}

export type EmailAction =
  | "read"
  | "unread"
  | "star"
  | "unstar"
  | "important"
  | "unimportant"
  | "move"
  | "delete"
  | "archive"
  | "restore";

export interface EmailActionRequest {
  action: EmailAction;
  /** Target folder for move action */
  folder?: string;
}

export interface ComposeSendRequest {
  from?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  bodyType?: "html" | "text";
  inReplyTo?: string;
  /** ISO date-time — if set, send is delayed until this time */
  scheduledAt?: string;
}

export interface SendResult {
  sent?: boolean;
  messageId?: string;
  /** ID for undo window tracking */
  sendId?: string;
}

export interface SendError {
  sent: false;
  message?: string;
}

export interface DraftDto {
  id?: string;
  userId?: string;
  to?: string[];
  cc?: string[];
  subject?: string;
  body?: string;
  updatedAt?: string;
}

export interface DraftUpsertRequest {
  /** Omit to create a new draft */
  id?: string;
  to?: string[];
  cc?: string[];
  subject?: string;
  body?: string;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export type AdminUserRole = "user" | "admin" | "support";
export type AdminUserStatus = "active" | "inactive" | "suspended";
export type ChangeRequestStatus = "draft" | "in_progress" | "review" | "released" | "rejected";
export type ChangeRequestPriority = "P0" | "P1" | "P2";
export type ChangeRequestScope = "ux" | "backend" | "fullstack" | "security";

export interface AdminUserRecord {
  id?: string;
  email?: string;
  role?: AdminUserRole;
  status?: AdminUserStatus;
  displayName?: string;
  createdAt?: string;
  lastActivityAt?: string;
}

export interface CreateAdminUserInput {
  email: string;
  role: AdminUserRole;
  displayName?: string;
}

export interface ChangeRequestChangelogEntry {
  summary?: string;
  releasedAt?: string;
}

export interface ChangeRequest {
  id?: string;
  title?: string;
  problem?: string;
  desiredOutcome?: string;
  status?: ChangeRequestStatus;
  priority?: ChangeRequestPriority;
  scope?: ChangeRequestScope;
  actor?: string;
  createdAt?: string;
  updatedAt?: string;
  changelogEntry?: ChangeRequestChangelogEntry;
}

export interface ChangeRequestCreateInput {
  title: string;
  problem?: string;
  desiredOutcome?: string;
  priority?: ChangeRequestPriority;
  scope?: ChangeRequestScope;
}

export interface ChangeRequestPatchInput {
  action?: string;
  note?: string;
  actor?: string;
  title?: string;
  problem?: string;
  desiredOutcome?: string;
  status?: ChangeRequestStatus;
}

export interface AdminListUsersResponse {
  generatedAt?: string;
  users?: AdminUserRecord[];
}

export interface AdminListChangeRequestsResponse {
  items?: ChangeRequest[];
}

export interface AdminWhoamiResponse {
  user_id?: string;
  email?: string;
  role?: string;
  /** true when ADMIN_RBAC_ENFORCE=1 on the backend */
  enforced?: boolean;
}

// ─── Monitoring ───────────────────────────────────────────────────────────────

export type MailEventStatus = "delivered" | "bounced" | "deferred" | "failed" | "queued";

export interface MonitoringSummary {
  window?: string;
  generatedAt?: string;
  total?: number;
  delivered?: number;
  bounced?: number;
  deliveryRate?: number;
  bounceRate?: number;
  avgTotalMs?: number;
  p95TotalMs?: number;
  avgRiskScore?: number;
  byStatus?: Record<string, number>;
}

export interface MailEvent {
  id?: string;
  ts?: string;
  status?: MailEventStatus;
  from?: string;
  to?: string;
  subject?: string;
  provider?: string;
  total_ms?: number;
  risk_score?: number;
  error?: string;
}

export interface ProviderStat {
  provider?: string;
  count?: number;
  delivered?: number;
  bounced?: number;
  deliveryRate?: number;
}

export type MonitoringAlertLevel = "info" | "warning" | "critical";

export interface MonitoringAlert {
  id?: string;
  level?: MonitoringAlertLevel;
  message?: string;
  triggeredAt?: string;
  resolved?: boolean;
}

export interface MonitoringEventsResponse {
  events?: MailEvent[];
  total?: number;
}

export interface MonitoringBouncesResponse {
  bounces?: MailEvent[];
}

export interface MonitoringProvidersTopResponse {
  providers?: ProviderStat[];
}

export interface MonitoringAlertsResponse {
  alerts?: MonitoringAlert[];
}
