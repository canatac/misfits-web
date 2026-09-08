import { describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import SearchPage from "@/app/search/page";

describe("/search page", () => {
  it("redirects to /mail when no query parameter is provided", () => {
    SearchPage({});
    expect(redirectMock).toHaveBeenCalledWith("/mail");
  });

  it("redirects to /mail with encoded search query", () => {
    SearchPage({ searchParams: { q: "invoice #42" } });
    expect(redirectMock).toHaveBeenCalledWith("/mail?search=invoice%20%2342");
  });

  it("supports legacy query parameter name", () => {
    SearchPage({ searchParams: { query: "alice" } });
    expect(redirectMock).toHaveBeenCalledWith("/mail?search=alice");
  });
});
