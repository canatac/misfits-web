// StorageGauge.tsx — extracted Sprint 4
import { HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}



export function StorageGauge({
  percentage,
  compact,
}: {
  percentage: number;
  compact?: boolean;
}) {
  const radius = compact ? 26 : 36;
  const stroke = compact ? 5 : 7;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const clamped = Math.max(0, Math.min(100, percentage));
  const offset = circumference - (clamped / 100) * circumference;
  const isCritical = clamped >= 80;

  return (
    <div className={cn("flex items-center", compact ? "gap-2" : "gap-3")}>
      <div className="relative">
        <svg width={radius * 2} height={radius * 2}>
          <circle
            stroke="#2A2A2E"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={isCritical ? "#F87171" : "#4ADE80"}
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            style={{
              strokeDashoffset: offset,
              transition: "stroke-dashoffset 300ms",
            }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            transform={`rotate(-90 ${radius} ${radius})`}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
          {clamped}%
        </span>
      </div>
      {!compact && (
        <div className="space-y-0.5 text-xs">
          <p className="text-white">Stockage cloud</p>
          <p className="text-[#71717A]">842 Go / 1000 Go</p>
        </div>
      )}
    </div>
  );
}
