/**
 * Dashboard card loading skeletons (Issue #413).
 *
 * Skeleton placeholders for dashboard cards during initial load
 * to eliminate layout shift and improve perceived performance.
 */

export interface SkeletonConfig {
  minDuration: number;
  animationDuration: number;
}

export const DEFAULT_SKELETON_CONFIG: SkeletonConfig = {
  minDuration: 300,
  animationDuration: 1500,
};

/**
 * Check if data is loading (show skeleton).
 */
export function isLoading(data: unknown): boolean {
  return data === undefined || data === null;
}

/**
 * Check if data is loaded (show content).
 */
export function isLoaded(data: unknown): boolean {
  return data !== undefined && data !== null;
}

/**
 * Get skeleton CSS classes.
 */
export function getSkeletonClasses(): string {
  return "animate-pulse bg-gray-200 rounded";
}

/**
 * Get skeleton bar CSS classes.
 */
export function getSkeletonBarClasses(): string {
  return "animate-pulse bg-gray-200 rounded h-4";
}

/**
 * Get skeleton circle CSS classes.
 */
export function getSkeletonCircleClasses(): string {
  return "animate-pulse bg-gray-200 rounded-full";
}

/**
 * Show skeleton if loading.
 */
export function showSkeletonIfLoading(data: unknown): boolean {
  return isLoading(data);
}

/**
 * Get minimum display duration.
 */
export function getMinDuration(config: SkeletonConfig = DEFAULT_SKELETON_CONFIG): number {
  return config.minDuration;
}
