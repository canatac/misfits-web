/**
 * Email List Density Setting (Compact/Comfortous/Spacious)
 *
 * Controls the vertical padding and font size of email list items.
 */

export type ListDensity = 'compact' | 'comfortable' | 'spacious';

export interface DensityConfig {
  rowHeight: number;
  fontSize: number;
  padding: number;
  showPreview: boolean;
  maxPreviewLines: number;
}

const densityConfigs: Record<ListDensity, DensityConfig> = {
  compact: { rowHeight: 36, fontSize: 13, padding: 4, showPreview: false, maxPreviewLines: 0 },
  comfortable: { rowHeight: 48, fontSize: 14, padding: 8, showPreview: true, maxPreviewLines: 1 },
  spacious: { rowHeight: 64, fontSize: 15, padding: 12, showPreview: true, maxPreviewLines: 2 },
};

export function getDensityConfig(density: ListDensity): DensityConfig {
  return densityConfigs[density];
}

export function getRowHeight(density: ListDensity): number {
  return densityConfigs[density].rowHeight;
}

export function getFontSize(density: ListDensity): number {
  return densityConfigs[density].fontSize;
}

export function shouldShowPreview(density: ListDensity): boolean {
  return densityConfigs[density].showPreview;
}

export function cycleDensity(current: ListDensity): ListDensity {
  const order: ListDensity[] = ['compact', 'comfortable', 'spacious'];
  const idx = order.indexOf(current);
  return order[(idx + 1) % order.length];
}

export function getDensityLabel(density: ListDensity): string {
  switch (density) {
    case 'compact': return 'Compact';
    case 'comfortable': return 'Comfortable';
    case 'spacious': return 'Spacious';
    default: return density;
  }
}
