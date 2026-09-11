import { describe, it, expect } from "vitest";
import {
  isLoading,
  isLoaded,
  getSkeletonClasses,
  getSkeletonBarClasses,
  getSkeletonCircleClasses,
  showSkeletonIfLoading,
  getMinDuration,
} from "@/lib/dashboard-skeletons";

describe("dashboard-skeletons", () => {
  it("checks loading state", () => {
    expect(isLoading(undefined)).toBe(true);
    expect(isLoading(null)).toBe(true);
    expect(isLoading("data")).toBe(false);
    expect(isLoading(0)).toBe(false);
  });

  it("checks loaded state", () => {
    expect(isLoaded("data")).toBe(true);
    expect(isLoaded(0)).toBe(true);
    expect(isLoaded(false)).toBe(true);
    expect(isLoaded(undefined)).toBe(false);
    expect(isLoaded(null)).toBe(false);
  });

  it("returns skeleton classes", () => {
    expect(getSkeletonClasses()).toContain("animate-pulse");
    expect(getSkeletonBarClasses()).toContain("animate-pulse");
    expect(getSkeletonCircleClasses()).toContain("animate-pulse");
  });

  it("shows skeleton if loading", () => {
    expect(showSkeletonIfLoading(undefined)).toBe(true);
    expect(showSkeletonIfLoading(null)).toBe(true);
    expect(showSkeletonIfLoading("data")).toBe(false);
  });

  it("gets min duration", () => {
    expect(getMinDuration()).toBe(300);
  });
});
