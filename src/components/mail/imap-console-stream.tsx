"use client";

import * as React from "react";
import { detectImapErrorHint } from "@/lib/imap-error-hints";

export interface Line {
  dir: string;
  text: string;
}

export type ImapConsoleStatus = "idle" | "running" | "done" | "error";

export interface UseImapStreamResult {
  lines: Line[];
  status: ImapConsoleStatus;
  finalError: string | null;
}

const BATCH_MS = 60;

export function useImapStream(
  input: unknown | null,
  onDone?: (result: { ok: boolean; error?: string }) => void
): UseImapStreamResult {
  const [lines, setLines] = React.useState<Line[]>([]);
  const [status, setStatus] = React.useState<ImapConsoleStatus>("idle");
  const [finalError, setFinalError] = React.useState<string | null>(null);
  const bufferRef = React.useRef<Line[]>([]);
  const timerRef = React.useRef<number | null>(null);

  const flushBuffer = React.useCallback(() => {
    timerRef.current = null;
    if (bufferRef.current.length === 0) return;
    const batch = bufferRef.current;
    bufferRef.current = [];
    setLines((prev) => prev.concat(batch));
  }, []);

  const pushLine = React.useCallback(
    (line: Line) => {
      bufferRef.current.push(line);
      if (timerRef.current == null) {
        timerRef.current = window.setTimeout(flushBuffer, BATCH_MS);
      }
    },
    [flushBuffer]
  );

  React.useEffect(() => {
    if (!input) return;
    let aborted = false;
    const controller = new AbortController();

    function handleFrame(frame: string) {
      let event = "message";
      let data = "";
      for (const raw of frame.split("\n")) {
        if (raw.startsWith("event:")) event = raw.slice(6).trim();
        else if (raw.startsWith("data:")) data += raw.slice(5).trim();
      }
      if (!data) return;
      try {
        const parsed = JSON.parse(data);
        if (event === "line") {
          pushLine({ dir: parsed.dir ?? "", text: parsed.text ?? "" });
        } else if (event === "done") {
          if (timerRef.current != null) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          flushBuffer();
          setStatus(parsed.ok ? "done" : "error");
          if (!parsed.ok) setFinalError(parsed.error ?? "IMAP probe failed");
          onDone?.({ ok: !!parsed.ok, error: parsed.error });
        }
      } catch {
        // ignore
      }
    }

    async function run() {
      setLines([]);
      bufferRef.current = [];
      setStatus("running");
      setFinalError(null);
      try {
        const res = await fetch("/api/external-accounts/probe-stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify(input),
          signal: controller.signal,
        });
        if (!res.body) throw new Error("no response body");
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        while (!aborted) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let idx = buf.indexOf("\n\n");
          while (idx >= 0) {
            const frame = buf.slice(0, idx);
            buf = buf.slice(idx + 2);
            handleFrame(frame);
            idx = buf.indexOf("\n\n");
          }
        }
      } catch (e) {
        if (aborted) return;
        setStatus("error");
        const msg = e instanceof Error ? e.message : String(e);
        setFinalError(msg);
        onDone?.({ ok: false, error: msg });
      }
    }

    run();
    return () => {
      aborted = true;
      controller.abort();
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [input, onDone, pushLine, flushBuffer]);

  return { lines, status, finalError };
}

export function ImapHintBlock({
  finalError,
  lines,
}: {
  finalError: string | null;
  lines: Line[];
}) {
  const haystack = [
    finalError ?? "",
    ...lines.filter((l) => l.dir === "<").map((l) => l.text),
  ].join("\n");
  const hint = detectImapErrorHint(haystack);
  if (!hint) return null;
  return (
    <div className="border-t border-neutral-800 bg-neutral-900 px-3 py-2 text-xs">
      <div className="font-medium text-amber-300">{hint.title}</div>
      <div className="mt-0.5 text-neutral-300">{hint.description}</div>
      {hint.cta && (
        <a
          href={hint.cta.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-sky-300 underline hover:text-sky-200"
        >
          {hint.cta.label} ↗
        </a>
      )}
    </div>
  );
}
