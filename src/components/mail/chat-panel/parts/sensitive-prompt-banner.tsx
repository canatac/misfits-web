"use client";

import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SensitivePromptBannerProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function SensitivePromptBanner({
  onConfirm,
  onCancel,
}: SensitivePromptBannerProps) {
  return (
    <div className="mx-3 mt-3 rounded-md border border-amber-400/50 bg-amber-500/10 p-2 text-xs">
      <div className="flex items-center gap-2 text-amber-600">
        <ShieldAlert className="h-4 w-4" />
        <span className="font-medium">Action sensible détectée</span>
      </div>
      <p className="mt-1">Confirmation requise avant envoi du prompt.</p>
      <div className="mt-2 flex gap-2">
        <Button size="sm" onClick={onConfirm}>
          Confirmer
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
