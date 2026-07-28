/**
 * Email domain types for misfits.ai Mail
 */

export type Folder = "inbox" | "sent" | "drafts" | "archive" | "trash" | "spam";

export type SortBy = "date" | "sender" | "subject" | "size" | "unreadFirst";

export type FilterType = "all" | "unread" | "starred" | "attachments";

export type AttachmentType =
  | "pdf"
  | "image"
  | "doc"
  | "spreadsheet"
  | "presentation"
  | "archive"
  | "audio"
  | "video"
  | "other";

export interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  type: AttachmentType;
  url?: string;
  downloadUrl?: string;
  previewUrl?: string;
}

export interface EmailFolder {
  id: Folder;
  name: string;
  icon: string;
  unreadCount: number;
  totalCount: number;
}

export interface EmailLabel {
  id: string;
  name: string;
  color: string;
}

export interface EmailAddress {
  name: string;
  address: string;
}

export interface Email {
  id: string;
  threadId: string;
  folder: Folder;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  replyTo?: EmailAddress;
  subject: string;
  preview: string;
  body: string;
  bodyType: "html" | "text";
  date: string;
  receivedAt: string;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  hasAttachments: boolean;
  attachments: EmailAttachment[];
  labels: string[];
  size: number;
  messageId: string;
  inReplyTo?: string;
  references?: string[];
  headers?: Record<string, string>;
}

export interface EmailListResponse {
  emails: Email[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface EmailQuery {
  folder?: Folder;
  sortBy?: SortBy;
  filterType?: FilterType;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
  label?: string;
}

export interface EmailAccount {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isActive: boolean;
  provider: string;
}
