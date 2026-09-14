export type MessageIndicator = 'replied' | 'forwarded' | 'none';

export function getIndicator(subject: string): MessageIndicator {
  if (/^(re|fw[d]?):/i.test(subject.trim())) {
    return subject.toLowerCase().startsWith('re:') ? 'replied' : 'forwarded';
  }
  return 'none';
}

export function getIndicatorIcon(indicator: MessageIndicator): string {
  switch (indicator) {
    case 'replied': return '↩';
    case 'forwarded': return '↪';
    default: return '';
  }
}

export function getIndicatorLabel(indicator: MessageIndicator): string {
  switch (indicator) {
    case 'replied': return 'Replied';
    case 'forwarded': return 'Forwarded';
    default: return '';
  }
}

export function hasIndicator(indicator: MessageIndicator): boolean {
  return indicator !== 'none';
}
