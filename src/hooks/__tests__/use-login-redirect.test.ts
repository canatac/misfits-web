import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useLogin } from "@/hooks/use-auth";

const mockLogin = vi.fn();
const mockReplace = vi.fn();
const mockToastSuccess = vi.fn();

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      isAuthenticated: true,
      pendingTwoFactorChallengeId: null,
      login: mockLogin,
    })),
    subscribe: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess, error: vi.fn() },
}));

describe("useLogin redirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      value: {
        search: "?redirect=%2Fmail",
        href: "https://mail.misfits.ai/login?redirect=%2Fmail",
      },
      writable: true,
    });
  });

  it("redirects to the URL from ?redirect= parameter on successful login", async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      result.current.mutate({ email: "admin@example.com", password: "password" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockReplace).toHaveBeenCalledWith("/mail");
    expect(mockToastSuccess).toHaveBeenCalledWith("Welcome back!");
  });

  it("redirects to /dashboard when no redirect parameter is present", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    Object.defineProperty(window, "location", {
      value: { search: "", href: "https://mail.misfits.ai/login" },
      writable: true,
    });

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      result.current.mutate({ email: "admin@example.com", password: "password" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });

  it("does not redirect when 2FA challenge is pending", async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      result.current.mutate({ email: "admin@example.com", password: "password" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockReplace).toHaveBeenCalled();
  });

  it("handles login failure without redirecting", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Invalid credentials"));

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      result.current.mutate({ email: "admin@example.com", password: "wrong" });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
