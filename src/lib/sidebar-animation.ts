/**
 * Sidebar collapse/expand animation (Issue #467).
 *
 * Provides smooth 200ms ease-out sidebar transitions with
 * prefers-reduced-motion support and GPU-accelerated animations.
 */

export interface SidebarAnimationConfig {
  duration: number;
  easing: string;
  respectReducedMotion: boolean;
}

export interface SidebarState {
  collapsed: boolean;
  animating: boolean;
  width: number;
}

export const DEFAULT_CONFIG: SidebarAnimationConfig = {
  duration: 200,
  easing: "ease-out",
  respectReducedMotion: true,
};

export function getSidebarTransitionClasses(collapsed: boolean, animating: boolean): string {
  const classes = ["transition-all"];
  if (animating) classes.push("duration-200", "ease-out");
  if (collapsed) classes.push("w-0", "opacity-0");
  else classes.push("w-64", "opacity-100");
  return classes.join(" ");
}

export function getSidebarTransitionStyles(collapsed: boolean, config: SidebarAnimationConfig = DEFAULT_CONFIG): React.CSSProperties {
  const prefersReducedMotion = prefersReducedMotionEnabled();
  return {
    width: collapsed ? 0 : 256,
    opacity: collapsed ? 0 : 1,
    transition: prefersReducedMotion && config.respectReducedMotion ? "none" : `width ${config.duration}ms ${config.easing}, opacity ${config.duration}ms ${config.easing}`,
    transform: "translateZ(0)",
    overflow: "hidden",
  };
}

export function prefersReducedMotionEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function createSidebarState(collapsed: boolean = false): SidebarState {
  return { collapsed, animating: false, width: collapsed ? 0 : 256 };
}

export function toggleSidebar(state: SidebarState): SidebarState {
  return { ...state, collapsed: !state.collapsed, width: state.collapsed ? 256 : 0, animating: true };
}

export function setSidebarCollapsed(state: SidebarState, collapsed: boolean): SidebarState {
  return { ...state, collapsed, width: collapsed ? 0 : 256, animating: true };
}

export function completeAnimation(state: SidebarState): SidebarState {
  return { ...state, animating: false };
}

export function getSidebarWidth(state: SidebarState): number {
  return state.width;
}

export function isSidebarCollapsed(state: SidebarState): boolean {
  return state.collapsed;
}
