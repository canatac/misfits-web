"use client";

import { useState } from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { checkUrlReputation } from "@/lib/url-scanner";
import { Button } from "@/components/ui/button";

interface UrlSafeLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * A link of an email body. When the URL is suspicious the navigation is
 * prevented and a warning page is shown, with an explicit option to continue
 * (AC4). Safe links open in a new tab with noopener/noreferrer.
 */
export function UrlSafeLink({ href, children, className }: UrlSafeLinkProps) {
  const [blocked, setBlocked] = useState(false);
  const reputation = checkUrlReputation(href);

  function handleClick(e: React.MouseEvent) {
    if (reputation.isSuspicious) {
      e.preventDefault();
      setBlocked(true);
    }
  }

  function proceed() {
    setBlocked(false);
    window.open(href, "_blank", "noopener,noreferrer");
  }

  if (blocked) {
    return (
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="url-warning-title"
        aria-describedby="url-warning-description"
        className="rounded-[var(--radius-md)] border border-amber-500/50 bg-amber-500/10 p-4"
        data-testid="url-warning-page"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
          <h2 id="url-warning-title" className="text-base font-semibold text-amber-300">
            Suspicious Link Warning
          </h2>
        </div>
        <div id="url-warning-description" className="mt-2 text-sm text-amber-200">
          <p>
            This link appears to be suspicious:{" "}
            <span className="font-mono text-xs">{reputation.domain}</span>
          </p>
          <ul className="mt-2 list-disc pl-5">
            {reputation.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className="mt-2">Are you sure you want to continue?</p>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setBlocked(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={proceed}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Proceed anyway
          </Button>
        </div>
      </div>
    );
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      rel="noopener noreferrer"
    >
      {children}
      {reputation.isSuspicious && (
        <AlertTriangle
          className="ml-1 inline h-3 w-3 text-amber-400"
          aria-label="Suspicious link"
        />
      )}
    </a>
  );
}
