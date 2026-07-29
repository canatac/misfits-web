/**
 * Secure AI proxy route handler.
 *
 * Browser requests to `/api/ai` are proxied here so the secret
 * OPENROUTER_API_KEY stays server-side and is never shipped to the client.
 * The route imports the `*Direct` functions from the AI client (which POST to
 * OpenRouter directly) and either returns JSON or re-emits the SSE stream.
 *
 * Next.js route handlers take precedence over the `/api/:path*` rewrite to
 * the backend, so this handler always resolves for `/api/ai`.
 */
import { NextRequest } from "next/server";
import {
  AIError,
  AI_MODEL,
  chatCompletionDirect,
  streamChatCompletionDirect,
} from "@/lib/ai-client";
import type { ChatMessage } from "@/types/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AIBody {
  messages?: ChatMessage[];
  stream?: boolean;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

function jsonError(message: string, status: number) {
  return Response.json({ error: { message } }, { status });
}

export async function POST(req: NextRequest) {
  // Guard: refuse to run without a configured key.
  if (!process.env.OPENROUTER_API_KEY) {
    return jsonError("AI service is not configured (missing OPENROUTER_API_KEY).", 503);
  }

  let body: AIBody;
  try {
    body = (await req.json()) as AIBody;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return jsonError("`messages` is required and must be a non-empty array.", 400);
  }

  const opts = {
    model: body.model || AI_MODEL,
    temperature: body.temperature,
    maxTokens: body.maxTokens,
  };

  // Streaming: re-emit the SSE stream to the browser.
  if (body.stream) {
    const encoder = new TextEncoder();
    const stream = streamChatCompletionDirect(body.messages, opts);
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
            );
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (err) {
          const message =
            err instanceof AIError
              ? err.message
              : "AI streaming failed.";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: { message } })}\n\n`),
          );
        } finally {
          controller.close();
        }
      },
    });
    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  // Non-streaming: return the full response as JSON.
  try {
    const result = await chatCompletionDirect(body.messages, opts);
    return Response.json(result);
  } catch (err) {
    const status = err instanceof AIError ? err.status : 500;
    const message = err instanceof Error ? err.message : "AI request failed.";
    return jsonError(message, Math.max(status, 400));
  }
}
