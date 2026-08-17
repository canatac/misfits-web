/**
 * <ImapConsole /> — live IMAP session viewer used inside the Add-Account modal.
 * Streams request/response lines from the backend probe endpoint.
 */
"use client";

import * as React from "react";
import {
  useImapStream,
  ImapHintBlock,
} from "@/components/mail/imap-console-stream";

export interface ImapConsoleProbeInput {
  host: string;
  port: number;
  tls: boolean;
  username: string;
  password: string;
  folder?: string;
  since?: string;
}

interface Props {
  input: ImapConsoleProbeInput | null;
  onDone?: (result: { ok: boolean; error?: string }) => void;
  title?: string;
}

export function ImapConsole({ input, onDone, title }: Props) {
  const { lines, status, finalError } = useImapStream(input, onDone);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const stickyRef = React.useRef(true);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el || !stickyRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [lines.length]);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 16;
    stickyRef.current = nearBottom;
  }

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
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-64 overflow-y-scroll overflow-x-hidden px-3 py-2 leading-5"
        style={{
          overflowAnchor: "none",
          scrollBehavior: "auto",
          scrollbarGutter: "stable",
          contain: "strict",
          willChange: "scroll-position",
        }}
      >
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
      {status === "error" && (
        <ImapHintBlock finalError={finalError} lines={lines} />
      )}
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
