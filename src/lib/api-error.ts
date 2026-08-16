/**
 * API error type + JSON response parser used by `api-client`.
 *
 * Kept in its own module so both the client and the individual API wrappers
 * can import the error class without pulling in the fetch/refresh machinery
 * (and to keep `api-client.ts` under the LOC guardrail).
 */

export interface ApiErrorBody {
  /** Machine-readable error code (mirrors backend). */
  code?: string;
  message: string;
  /** When the rate-limit window resets (epoch ms). */
  retryAfter?: number;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly retryAfter?: number;
  readonly body?: unknown;

  constructor(
    status: number,
    message: string,
    opts?: { code?: string; retryAfter?: number; body?: unknown }
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = opts?.code;
    this.retryAfter = opts?.retryAfter;
    this.body = opts?.body;
  }

  /** Convenience: was the error caused by network unavailability? */
  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

/**
 * Parse a `fetch` Response into a typed value, throwing `ApiError` on any
 * non-2xx status. Handles JSON, text and 204/no-content responses.
 */
export async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";

  if (response.ok) {
    if (contentType.includes("application/json")) {
      return (await response.json()) as T;
    }
    // Non-JSON success (e.g. text) — coerce to text typed as T.
    return (await response.text()) as unknown as T;
  }

  // Error path
  if (contentType.includes("application/json")) {
    let body: ApiErrorBody & { error?: { code?: string; message?: string } };
    try {
      body = (await response.json()) as ApiErrorBody & {
        error?: { code?: string; message?: string };
      };
    } catch {
      body = { message: response.statusText };
    }
    const retryAfter = response.headers.get("retry-after");
    // Backend also uses a nested shape `{ error: { code, message } }`
    // (external-accounts, admin ops). Fall back to it when the flat
    // fields are absent so the UI shows a meaningful message.
    const nestedMsg = body.error?.message;
    const nestedCode = body.error?.code;
    throw new ApiError(
      response.status,
      body.message ?? nestedMsg ?? response.statusText,
      {
        code: body.code ?? nestedCode,
        retryAfter:
          body.retryAfter ??
          (retryAfter ? Number(retryAfter) * 1000 + Date.now() : undefined),
        body,
      }
    );
  }

  throw new ApiError(response.status, response.statusText || "Request failed");
}
