"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

type Props = {
  lastLoginAt?: string | null;
};

export function NewLoginNotification({ lastLoginAt }: Props) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [lastLoginAt]);

  if (!lastLoginAt || dismissed) return null;

  return (
    <Alert variant="default" role="status" className="flex items-start gap-2">
      <ShieldAlert className="mt-0.5 h-4 w-4" aria-hidden="true" />
      <AlertDescription className="flex-1">
        <span className="font-medium">New sign-in detected.</span> If this was not you,
        change your password immediately.
      </AlertDescription>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-sm underline"
        aria-label="Dismiss new sign-in notification"
      >
        Dismiss
      </button>
    </Alert>
  );
}
