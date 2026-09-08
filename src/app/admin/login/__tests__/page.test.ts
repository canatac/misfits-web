import { describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import AdminLoginPage from "@/app/admin/login/page";

describe("AdminLoginPage", () => {
  it("redirects to login with admin target", () => {
    AdminLoginPage();
    expect(redirectMock).toHaveBeenCalledWith("/login?redirect=/admin");
  });
});
