/**
 * Integration test: API client contract vs backend error shapes.
 *
 * Backend (reimagined-guide) emits two error shapes:
 *   Flat:  { code: "...", message: "..." }
 *   Nested: { error: { code: "...", message: "..." } }
 *
 * This test verifies parseResponse handles both correctly — a cross-repo
 * contract regression guard so frontend never crashes on backend errors.
 */
import { describe, it, expect } from "vitest";
import { parseResponse, ApiError } from "@/lib/api-client-errors";

function mockResponse(
  status: number,
  body: unknown,
  contentType = "application/json"
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": contentType },
  });
}

describe("API client contract: error shape parity", () => {
  it("parses flat { code, message } error shape", async () => {
    const res = mockResponse(400, {
      code: "INVALID_INPUT",
      message: "Email is required",
    });
    await expect(parseResponse(res)).rejects.toMatchObject({
      status: 400,
      code: "INVALID_INPUT",
      message: "Email is required",
    });
  });

  it("parses nested { error: { code, message } } shape", async () => {
    const res = mockResponse(422, {
      error: { code: "VALIDATION", message: "Invalid field" },
    });
    await expect(parseResponse(res)).rejects.toMatchObject({
      status: 422,
      code: "VALIDATION",
      message: "Invalid field",
    });
  });

  it("prefers flat fields when both shapes present", async () => {
    const res = mockResponse(400, {
      code: "FLAT_CODE",
      message: "Flat message",
      error: { code: "NESTED_CODE", message: "Nested message" },
    });
    await expect(parseResponse(res)).rejects.toMatchObject({
      code: "FLAT_CODE",
      message: "Flat message",
    });
  });

  it("falls back to 'Request failed' when no body and no statusText", async () => {
    const res = new Response("", { status: 500 });
    await expect(parseResponse(res)).rejects.toMatchObject({
      status: 500,
      message: "Request failed",
    });
  });

  it("parses Retry-After header into epoch ms", async () => {
    const res = mockResponse(
      429,
      { code: "RATE_LIMITED", message: "Too many requests" }
    );
    res.headers.set("retry-after", "30");
    try {
      await parseResponse(res);
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      const apiErr = e as ApiError;
      expect(apiErr.retryAfter).toBeGreaterThan(Date.now());
      expect(apiErr.retryAfter!).toBeLessThanOrEqual(Date.now() + 30_000 + 50);
    }
  });

  it("returns undefined for 204 No Content", async () => {
    const res = new Response(null, { status: 204 });
    const result = await parseResponse<undefined>(res);
    expect(result).toBeUndefined();
  });

  it("returns text body for non-JSON success", async () => {
    const res = new Response("plain text", {
      status: 200,
      headers: { "content-type": "text/plain" },
    });
    const result = await parseResponse<string>(res);
    expect(result).toBe("plain text");
  });
});
