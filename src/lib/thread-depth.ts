/**
 * Visual thread depth indicators (Issue #452).
 *
 * CSS-based nested thread lines showing reply depth with indentation.
 */

export interface ThreadDepthConfig {
  indentPerLevel: number;
  maxIndent: number;
  lineColor: string;
  lineOpacity: number;
  activeLineOpacity: number;
}

export const DEFAULT_CONFIG: ThreadDepthConfig = {
  indentPerLevel: 16,
  maxIndent: 48,
  lineColor: "#C49B66",
  lineOpacity: 0.3,
  activeLineOpacity: 1.0,
};

/**
 * Calculate indent for depth level (clamped to max).
 */
export function calculateIndent(depth: number, config: ThreadDepthConfig = DEFAULT_CONFIG): number {
  return Math.min(depth * config.indentPerLevel, config.maxIndent);
}

/**
 * Get CSS styles for thread depth line.
 */
export function getDepthLineStyles(
  depth: number,
  isActive: boolean,
  config: ThreadDepthConfig = DEFAULT_CONFIG
): React.CSSProperties {
  const indent = calculateIndent(depth, config);
  const opacity = isActive ? config.activeLineOpacity : config.lineOpacity;

  return {
    borderLeft: `2px solid ${config.lineColor}`,
    borderLeftColor: `${config.lineColor}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`,
    paddingLeft: `${indent + 8}px`,
    marginLeft: `${indent}px`,
    position: "relative",
  };
}

/**
 * Get depth level label for screen readers.
 */
export function getDepthAriaLabel(depth: number): string {
  if (depth === 0) return "Original message";
  if (depth === 1) return "Direct reply";
  return `Reply at depth ${depth}`;
}

/**
 * Check if depth is at maximum clamp.
 */
export function isMaxDepth(depth: number, config: ThreadDepthConfig = DEFAULT_CONFIG): boolean {
  return depth * config.indentPerLevel >= config.maxIndent;
}

/**
 * Get collapse preview line styles.
 */
export function getCollapsedPreviewStyles(config: ThreadDepthConfig = DEFAULT_CONFIG): React.CSSProperties {
  return {
    borderLeft: `1px dashed ${config.lineColor}`,
    borderLeftColor: `${config.lineColor}${Math.round(0.2 * 255).toString(16).padStart(2, "0")}`,
  };
}

/**
 * Calculate visual depth for a thread.
 */
export function calculateVisualDepth(parentDepths: number[], currentIndex: number): number {
  if (currentIndex === 0) return 0;
  if (currentIndex <= parentDepths.length) return parentDepths[currentIndex - 1] + 1;
  return 1;
}
