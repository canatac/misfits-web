import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockLogin = vi.hoisted(() => vi.fn());
const mockReplace = vi.hoisted(() => vi.fn());
const mockToastSuccess = vi.hoisted(() => vi.fn());

const mockState = {
  isAuthenticated: true,
  pendingTwoFactorChallengeId: null,
  login: mockLogin,
  error: null,
  user: null,
  session: null,
  isLoading: false,
  logout: vi.fn(),
  register: vi.fn(),
  verify2FA: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  refreshSession: vi.fn(),
  clearError: vi.fn(),
  hydrate: vi.fn(),
};

vi.mock("@/stores/auth-store", () => {
  const useAuthStore = (selector: (state: typeof mockState) => unknown) => selector(mockState);
  useAuthStore.getState = () => mockState;
  useAuthStore.setState = vi.fn();
  useAuthStore.subscribe = vi.fn();
  return { useAuthStore };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess, error: vi.fn() },
}));

import { useLogin } from "@/hooks/use-auth";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

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

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

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

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ email: "admin@example.com", password: "password" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });

  it("handles login failure without redirecting", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Invalid credentials"));

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ email: "admin@example.com", password: "wrong" });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
