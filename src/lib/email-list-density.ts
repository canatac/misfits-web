/**
 * Email List Density Setting (Compact/Comfortous/Spacious)
 *
 * Controls the vertical padding and font size of email list items.
 */

export type ListDensity = 'compact' | 'comfortable' | 'spacious';

export interface DensityConfig { 
  rowHeight: number; 
  fontSize: number; 
  showPreview: boolean; 
  avatarSize: number; 
  paddingY: number; 
  paddingX: number 
}

export type DensityMode = "compact" | "default" | "comfortable";


export const DENSITY_CONFIGS: Record<DensityMode, DensityConfig> = {
  compact: { rowHeight: 36, fontSize: 12, showPreview: false, avatarSize: 0, paddingY: 4, paddingX: 8 },
  default: { rowHeight: 56, fontSize: 14, showPreview: true, avatarSize: 32, paddingY: 8, paddingX: 12 },
  comfortable: { rowHeight: 72, fontSize: 15, showPreview: true, avatarSize: 40, paddingY: 12, paddingX: 16 },
};

export function getDensityConfig(mode: DensityMode): DensityConfig { 
  return DENSITY_CONFIGS[mode]; 
}

export function densityStyles(mode: DensityConfig): Record<string, string> {
  return { 
    "--email-row-height": `${mode.rowHeight}px`, 
    "--email-font-size": `${mode.fontSize}px`, 
    "--email-avatar-size": `${mode.avatarSize}px`, 
    "--email-padding-y": `${mode.paddingY}px`, 
    "--email-padding-x": `${mode.paddingX}px` };
}

export function parseDensityMode(value: string | undefined | null): DensityMode {
  if (value === "compact" || value === "default" || value === "comfortable") return value;
  return "default";
}

export function cycleDensity(current: DensityMode): DensityMode {
  const order: DensityMode[] = ["compact", "default", "comfortable"];
  return order[(order.indexOf(current) + 1) % order.length];
}

export function visibleRows(viewportHeight: number, rowHeight: number): number {
  if (rowHeight <= 0) return 0;
  return Math.floor(viewportHeight / rowHeight);
}

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
