/**
 * Reply/forward indicator icons (Issue #453).
 *
 * Visual status indicators for replied/forwarded emails in the list.
 */

export type EmailStatus = "none" | "replied" | "forwarded" | "both";

export interface EmailStatusInfo {
  hasReply: boolean;
  hasForward: boolean;
}

/**
 * Get email status from flags.
 */
export function getEmailStatus(info: EmailStatusInfo): EmailStatus {
  if (info.hasReply && info.hasForward) return "both";
  if (info.hasReply) return "replied";
  if (info.hasForward) return "forwarded";
  return "none";
}

/**
 * Check if status has reply.
 */
export function hasReply(status: EmailStatus): boolean {
  return status === "replied" || status === "both";
}

/**
 * Check if status has forward.
 */
export function hasForward(status: EmailStatus): boolean {
  return status === "forwarded" || status === "both";
}

/**
 * Get tooltip text for status.
 */
export function getStatusTooltip(status: EmailStatus): string {
  switch (status) {
    case "replied":
      return "You replied";
    case "forwarded":
      return "You forwarded";
    case "both":
      return "You replied and forwarded";
    default:
      return "";
  }
}

/**
 * Get status icon names.
 */
export function getStatusIcons(status: EmailStatus): string[] {
  const icons: string[] = [];
  if (hasReply(status)) icons.push("reply");
  if (hasForward(status)) icons.push("forward");
  return icons;
}

/**
 * Check if status should show indicators.
 */
export function shouldShowIndicators(status: EmailStatus): boolean {
  return status !== "none";
}

/**
 * Get status aria-label.
 */
export function getStatusAriaLabel(status: EmailStatus): string {
  switch (status) {
    case "replied":
      return "You replied to this email";
    case "forwarded":
      return "You forwarded this email";
    case "both":
      return "You replied and forwarded this email";
    default:
      return "";
  }
}
