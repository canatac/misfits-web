/**
 * <ImapConsole /> — live IMAP session viewer used inside the Add-Account modal.
 *
 * Streams every request/response line from the backend probe endpoint and
 * renders them in a scrollable, terminal-like block:
 *   > a1 CAPABILITY
 *   < * CAPABILITY IMAP4rev1 SASL-IR ...
 *   < a1 OK CAPABILITY completed
 *
 * The transport is a POST that returns text/event-stream (fetch + ReadableStream
 * parsing — EventSource can't POST, so we roll a minimal SSE parser inline).
 */
"use client";

import * as React from "react";

export interface ImapConsoleProbeInput {
  host: string;
  port: number;
  tls: boolean;
  username: string;
  password: string;
  /** Optional: exercise SELECT + SEARCH SINCE + FETCH headers. */
  folder?: string;
  /** ISO-8601 date; when set the probe adds a SEARCH SINCE + FETCH pass. */
  since?: string;
}

interface Line {
  dir: string; // ">" (client → server), "<" (server → client), "info", "error"
  text: string;
}

interface Props {
  input: ImapConsoleProbeInput | null;
  onDone?: (result: { ok: boolean; error?: string }) => void;
  /** Optional label rendered above the terminal. */
  title?: string;
}

/**
 * Public hook: consumers can `useImapProbe()` to trigger a probe run from a
 * button click, then render <ImapConsole input={probeInput} onDone={...} />.
 */
export function ImapConsole({ input, onDone, title }: Props) {
  const [lines, setLines] = React.useState<Line[]>([]);
  const [status, setStatus] = React.useState<"idle" | "running" | "done" | "error">(
    "idle"
  );
  const [finalError, setFinalError] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!input) return;
    let aborted = false;
    const controller = new AbortController();

    async function run() {
      setLines([]);
      setStatus("running");
      setFinalError(null);
      try {
        const res = await fetch("/api/external-accounts/probe-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
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
          // Split on double newline (SSE frame boundary).
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
        setFinalError(e instanceof Error ? e.message : String(e));
        onDone?.({ ok: false, error: e instanceof Error ? e.message : String(e) });
      }
    }

    function handleFrame(frame: string) {
      // Frames look like:
      //   event: line
      //   data: {"dir":">","text":"a1 CAPABILITY"}
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
          setLines((prev) => [...prev, { dir: parsed.dir ?? "", text: parsed.text ?? "" }]);
        } else if (event === "done") {
          setStatus(parsed.ok ? "done" : "error");
          if (!parsed.ok) setFinalError(parsed.error ?? "IMAP probe failed");
          onDone?.({ ok: !!parsed.ok, error: parsed.error });
        }
      } catch {
        // ignore malformed frame
      }
    }

    run();
    return () => {
      aborted = true;
      controller.abort();
    };
  }, [input, onDone]);

  // Auto-scroll to bottom on new lines.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length]);

  if (!input && status === "idle") {
    return null;
  }

  return (
    <div className="mt-3 rounded-md border border-neutral-700 bg-neutral-950 text-neutral-100 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-1.5">
        <span className="text-neutral-400">{title ?? "IMAP live console"}</span>
        <span
          className={
            status === "running"
              ? "text-yellow-400"
              : status === "done"
                ? "text-green-400"
                : status === "error"
                  ? "text-red-400"
                  : "text-neutral-500"
          }
        >
          {status}
        </span>
      </div>
      <div ref={scrollRef} className="max-h-64 overflow-auto px-3 py-2 leading-5">
        {lines.map((l, i) => (
          <div key={i} className={colorFor(l.dir)}>
            <span className="mr-2 text-neutral-500">{prefixFor(l.dir)}</span>
            <span>{l.text}</span>
          </div>
        ))}
        {finalError && (
          <div className="mt-2 text-red-400">
            <span className="mr-2 text-neutral-500">!</span>
            <span>{finalError}</span>
          </div>
        )}
        {lines.length === 0 && status === "running" && (
          <div className="text-neutral-500">connecting…</div>
        )}
      </div>
    </div>
  );
}

function prefixFor(dir: string) {
  if (dir === ">") return ">";
  if (dir === "<") return "<";
  if (dir === "info") return "i";
  if (dir === "error") return "!";
  return "·";
}

function colorFor(dir: string) {
  if (dir === ">") return "text-sky-300";
  if (dir === "<") return "text-neutral-100";
  if (dir === "info") return "text-neutral-500";
  if (dir === "error") return "text-red-400";
  return "text-neutral-300";
}
