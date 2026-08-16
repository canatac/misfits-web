"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { initialsFromName, type AvatarOption } from "../_lib/avatar";

export function AvatarPicker({
  avatarOptions,
  selectedAvatar,
  setSelectedAvatar,
  avatarNameEdits,
  selectedAvatarName,
  regenerateAvatars,
  updateSelectedAvatarName,
}: {
  avatarOptions: AvatarOption[];
  selectedAvatar: number;
  setSelectedAvatar: (idx: number) => void;
  avatarNameEdits: Record<string, string>;
  selectedAvatarName: string;
  regenerateAvatars: () => void;
  updateSelectedAvatarName: (next: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>Avatar</Label>
        <Button
          type="button"
          variant="outline"
          className="h-8 px-3 text-xs"
          onClick={regenerateAvatars}
        >
          Regenerer
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {avatarOptions.map((option, idx) => (
          <div key={option.id} className="space-y-1 text-center">
            <button
              type="button"
              onClick={() => setSelectedAvatar(idx)}
              className={cn(
                "mx-auto flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white transition",
                selectedAvatar === idx
                  ? "ring-2 ring-[var(--color-brand-500)] ring-offset-2 ring-offset-[var(--color-bg)]"
                  : "opacity-80 hover:opacity-100",
              )}
              style={{ background: option.background }}
              aria-label={`Select avatar ${option.name}`}
              aria-pressed={selectedAvatar === idx}
            >
              {initialsFromName(avatarNameEdits[option.id] ?? option.name)}
            </button>
            <p className="truncate text-[10px] text-[var(--color-muted-fg)]">
              {avatarNameEdits[option.id] ?? option.name}
            </p>
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <Label htmlFor="avatar-name">Nom d&apos;avatar (editable)</Label>
        <Input
          id="avatar-name"
          type="text"
          value={selectedAvatarName}
          onChange={(e) => updateSelectedAvatarName(e.target.value)}
          placeholder="stellar-rabbit"
          maxLength={30}
          autoCapitalize="none"
          spellCheck={false}
        />
      </div>
      <p className="text-xs text-[var(--color-muted-fg)]">
        Suggestions are generated on the fly and can be edited.
      </p>
    </div>
  );
}
