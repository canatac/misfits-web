"use client";

import { useState } from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { checkUrlReputation } from "@/lib/url-scanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UrlSafeLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Safe link component that intercepts clicks on suspicious URLs
 * and shows a confirmation dialog before navigating.
 */
export function UrlSafeLink({ href, children, className }: UrlSafeLinkProps) {
  const [showWarning, setShowWarning] = useState(false);
  const reputation = checkUrlReputation(href);

  function handleClick(e: React.MouseEvent) {
    if (reputation.isSuspicious) {
      e.preventDefault();
      setShowWarning(true);
    }
  }

  function proceed() {
    setShowWarning(false);
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <>
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
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Suspicious Link Warning
            </DialogTitle>
            <DialogDescription>
              This link appears to be suspicious:{" "}
              <span className="font-mono text-xs">{reputation.domain}</span>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {reputation.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <p className="mt-2 text-sm">
                Are you sure you want to proceed?
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowWarning(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={proceed}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Proceed anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
