/**
 * External recipient warning (Issue #443).
 *
 * Confirmation dialog when sending to external recipients
 * with session-level suppression option.
 */

export interface Recipient {
  email: string;
  name?: string;
  internal: boolean;
}

export interface ExternalWarningState {
  showDialog: boolean;
  externalRecipients: Recipient[];
  suppressForSession: boolean;
}

export interface ExternalWarningAction {
  type: "SHOW_DIALOG" | "HIDE_DIALOG" | "SET_SUPPRESS" | "RESET";
  payload?: { recipients?: Recipient[]; suppress?: boolean };
}

export const initialState: ExternalWarningState = {
  showDialog: false,
  externalRecipients: [],
  suppressForSession: false,
};

/**
 * Reducer for external warning state.
 */
export function externalWarningReducer(
  state: ExternalWarningState,
  action: ExternalWarningAction
): ExternalWarningState {
  switch (action.type) {
    case "SHOW_DIALOG":
      return { ...state, showDialog: true, externalRecipients: action.payload?.recipients ?? [] };
    case "HIDE_DIALOG":
      return { ...state, showDialog: false };
    case "SET_SUPPRESS":
      return { ...state, suppressForSession: action.payload?.suppress ?? false };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

/**
 * Check if recipient is external.
 */
export function isExternalRecipient(recipient: Recipient, internalDomains: string[]): boolean {
  const domain = recipient.email.split("@")[1]?.toLowerCase();
  return !internalDomains.includes(domain);
}

/**
 * Filter external recipients.
 */
export function filterExternalRecipients(
  recipients: Recipient[],
  internalDomains: string[]
): Recipient[] {
  return recipients.filter((r) => isExternalRecipient(r, internalDomains));
}

/**
 * Check if warning should be shown.
 */
export function shouldShowWarning(
  state: ExternalWarningState,
  recipients: Recipient[],
  internalDomains: string[]
): boolean {
  if (state.suppressForSession) return false;
  const external = filterExternalRecipients(recipients, internalDomains);
  return external.length > 0;
}

/**
 * Get external recipient emails.
 */
export function getExternalEmails(state: ExternalWarningState): string[] {
  return state.externalRecipients.map((r) => r.email);
}

/**
 * Get external recipient count.
 */
export function getExternalCount(state: ExternalWarningState): number {
  return state.externalRecipients.length;
}

/**
 * Check if dialog is visible.
 */
export function isWarningVisible(state: ExternalWarningState): boolean {
  return state.showDialog;
}

/**
 * Check if suppressed for session.
 */
export function isSuppressedForSession(state: ExternalWarningState): boolean {
  return state.suppressForSession;
}
