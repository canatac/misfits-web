export interface Recipient { email: string; name?: string }
export interface ClassifiedRecipient { recipient: Recipient; isExternal: boolean; domain: string | null }
export interface ExternalWarningResult { hasExternal: boolean; externalCount: number; internalCount: number; classified: ClassifiedRecipient[]; domains: string[] }

export function extractDomain(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at < 0 || at === trimmed.length - 1) return null;
  return trimmed.slice(at + 1);
}

export function isExternal(email: string, internalDomain: string): boolean {
  const domain = extractDomain(email);
  if (!domain) return false;
  const internal = internalDomain.toLowerCase();
  return domain !== internal && !domain.endsWith(`.${internal}`);
}

export function classifyRecipients(recipients: Recipient[], internalDomain: string): ClassifiedRecipient[] {
  return recipients.map((r) => ({ recipient: r, isExternal: isExternal(r.email, internalDomain), domain: extractDomain(r.email) }));
}

export function buildExternalWarning(recipients: Recipient[], internalDomain: string): ExternalWarningResult {
  const classified = classifyRecipients(recipients, internalDomain);
  const external = classified.filter((c) => c.isExternal);
  const domains = [...new Set(external.map((c) => c.domain).filter(Boolean))] as string[];
  return { hasExternal: external.length > 0, externalCount: external.length, internalCount: classified.length - external.length, classified, domains };
}

export function formatExternalWarning(result: ExternalWarningResult): string {
  if (!result.hasExternal) return "";
  const plural = result.externalCount === 1 ? "recipient" : "recipients";
  return `${result.externalCount} external ${plural} detected (${result.domains.join(", ")}).`;
}
