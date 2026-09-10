"use client";

/**
 * Account Settings page — manage per-account signatures (Issue #423).
 * Allows setting a custom HTML signature for each connected account.
 */
import { useState } from "react";
import { useAccountStore } from "@/stores/account-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Save, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

function initialsOf(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local.slice(0, 2).toUpperCase();
}

export default function AccountsSettingsPage() {
  const accounts = useAccountStore((s) => s.accounts);
  const setAccountSignature = useAccountStore((s) => s.setAccountSignature);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState<string>("");
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const startEditing = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    setEditingId(accountId);
    setDraftValue(account?.signature ?? "");
  };

  const saveSignature = () => {
    if (!editingId) return;
    setAccountSignature(editingId, draftValue.trim() || undefined);
    setSaved((prev) => ({ ...prev, [editingId]: true }));
    setEditingId(null);
    setTimeout(() => {
      setSaved((prev) => ({ ...prev, [editingId]: false }));
    }, 2000);
  };

  const resetSignature = () => {
    if (!editingId) return;
    setAccountSignature(editingId, undefined);
    setDraftValue("");
    setSaved((prev) => ({ ...prev, [editingId]: true }));
    setEditingId(null);
    setTimeout(() => {
      setSaved((prev) => ({ ...prev, [editingId]: false }));
    }, 2000);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Account Signatures</h1>
        <p className="text-sm text-[#71717A] mt-1">
          Set a custom email signature for each connected account. When composing
          from an account, its signature will be used automatically.
        </p>
      </div>

      {accounts.length === 0 ? (
        <Card className="bg-[#0A0A0B] border-[#242427]">
          <CardContent className="p-6 text-center text-[#71717A]">
            No accounts connected. Add an account to configure signatures.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => {
            const isEditing = editingId === account.id;
            const isSaved = saved[account.id];
            return (
              <Card
                key={account.id}
                className="bg-[#0A0A0B] border-[#242427]"
                data-testid={`account-signature-${account.id}`}
              >
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback
                      style={{ backgroundColor: account.color }}
                      className="text-white font-medium"
                    >
                      {account.avatar ?? initialsOf(account.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-base font-medium text-white">
                      {account.name ?? account.email.split("@")[0]}
                    </CardTitle>
                    <p className="text-xs text-[#71717A] flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {account.email}
                    </p>
                  </div>
                  {account.isDefault && (
                    <span className="text-xs bg-[#C49B66]/20 text-[#C49B66] px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {isEditing ? (
                    <>
                      <Textarea
                        value={draftValue}
                        onChange={(e) => setDraftValue(e.target.value)}
                        placeholder="Enter HTML signature (e.g., <strong>John Doe</strong><br/>Acme Corp)"
                        className="min-h-[120px] bg-[#1D1D20] border-[#242427] text-[#E0E0E0] font-mono text-sm"
                        data-testid={`signature-input-${account.id}`}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={saveSignature}
                          className="bg-[#C49B66] text-[#0A0A0B] hover:bg-[#b78f5c]"
                          data-testid={`save-signature-${account.id}`}
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={resetSignature}
                          className="text-[#71717A] hover:text-[#E0E0E0]"
                          data-testid={`reset-signature-${account.id}`}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Reset to default
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className={cn(
                          "rounded-lg border p-3 min-h-[60px] text-sm",
                          account.signature
                            ? "border-[#242427] bg-[#1D1D20] text-[#E0E0E0]"
                            : "border-dashed border-[#242427] text-[#71717A]"
                        )}
                      >
                        {account.signature ? (
                          <div
                            className="prose-mail"
                            dangerouslySetInnerHTML={{ __html: account.signature }}
                          />
                        ) : (
                          <span>No custom signature set. Uses default signature.</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditing(account.id)}
                          data-testid={`edit-signature-${account.id}`}
                        >
                          {account.signature ? "Edit" : "Add signature"}
                        </Button>
                        {isSaved && (
                          <span className="text-xs text-[#C49B66]">Saved!</span>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
