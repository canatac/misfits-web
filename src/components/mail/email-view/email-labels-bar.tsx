"use client";

import { ChevronDown, Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LabelBadge } from "@/components/mail/label-badge";
import type { Label } from "@/types/label";

interface EmailLabelsBarProps {
  emailId: string;
  emailLabelIds: string[];
  subject: string;
  labels: Label[];
  onAssign: (emailId: string, labelId: string) => void;
  onRemove: (emailId: string, labelId: string) => void;
  onOpenManager: () => void;
}

export function EmailLabelsBar({
  emailId,
  emailLabelIds,
  subject,
  labels,
  onAssign,
  onRemove,
  onOpenManager,
}: EmailLabelsBarProps) {
  return (
    <div className="mb-4 flex flex-col gap-2">
      <h1 className="text-xl font-semibold text-[var(--color-fg)]">{subject}</h1>
      {emailLabelIds.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {emailLabelIds.map((labelId) => (
            <LabelBadge
              key={labelId}
              label={labelId}
              size="md"
              onRemove={() => onRemove(emailId, labelId)}
            />
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              Add label
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Assign a label</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {labels.length === 0 && (
              <DropdownMenuItem disabled>No labels available</DropdownMenuItem>
            )}
            {labels.map((label) => {
              const alreadyAssigned = emailLabelIds.includes(label.id);
              return (
                <DropdownMenuItem
                  key={label.id}
                  disabled={alreadyAssigned}
                  onClick={() => onAssign(emailId, label.id)}
                  className="gap-2"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: label.color }}
                    aria-hidden="true"
                  />
                  <span className="flex-1">{label.name}</span>
                  {alreadyAssigned && (
                    <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
                  )}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onOpenManager} className="gap-2">
              <Plus className="h-3.5 w-3.5" />
              Manage labels
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
