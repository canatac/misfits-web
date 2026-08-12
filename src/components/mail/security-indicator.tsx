"use client";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import type { ThreatLevel } from "@/types/security";
import { cn } from "@/lib/utils";

const ICONS = {
  safe: ShieldCheck,
  suspicious: Shield,
  dangerous: ShieldAlert,
  critical: ShieldAlert,
};
const COLORS = {
  safe: "text-green-500",
  suspicious: "text-yellow-500",
  dangerous: "text-orange-500",
  critical: "text-red-500",
};
const LABELS = {
  safe: "Safe",
  suspicious: "Suspicious",
  dangerous: "Dangerous",
  critical: "Critical",
};

export function SecurityIndicator({
  threatLevel,
}: {
  threatLevel: ThreatLevel;
}) {
  if (threatLevel === "safe") return null;
  const Icon = ICONS[threatLevel];
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Icon className={cn("h-4 w-4 shrink-0", COLORS[threatLevel])} />
        </TooltipTrigger>
        <TooltipContent>Security: {LABELS[threatLevel]}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
