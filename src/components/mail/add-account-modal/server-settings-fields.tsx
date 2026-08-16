"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { SECURITY_OPTIONS } from "@/lib/account-presets";
import type { AccountServerConfig } from "@/types/account";

interface Props {
  serverConfig: AccountServerConfig;
  setServerConfig: React.Dispatch<React.SetStateAction<AccountServerConfig>>;
}

export function ServerSettingsFields({ serverConfig, setServerConfig }: Props) {
  return (
    <div className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)] p-3">
      <span className="text-sm font-medium">Server settings</span>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="imap-host">IMAP host</Label>
          <Input
            id="imap-host"
            value={serverConfig.imapHost}
            onChange={(e) =>
              setServerConfig((s) => ({ ...s, imapHost: e.target.value }))
            }
            placeholder="imap.example.com"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="imap-port">IMAP port</Label>
          <Input
            id="imap-port"
            type="number"
            min={1}
            max={65535}
            value={serverConfig.imapPort}
            onChange={(e) =>
              setServerConfig((s) => ({ ...s, imapPort: Number(e.target.value) }))
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="imap-security">IMAP security</Label>
          <Select
            value={serverConfig.imapSecurity}
            onValueChange={(v) =>
              setServerConfig((s) => ({
                ...s,
                imapSecurity: v as AccountServerConfig["imapSecurity"],
              }))
            }
          >
            <SelectTrigger id="imap-security">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SECURITY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="smtp-host">SMTP host</Label>
          <Input
            id="smtp-host"
            value={serverConfig.smtpHost}
            onChange={(e) =>
              setServerConfig((s) => ({ ...s, smtpHost: e.target.value }))
            }
            placeholder="smtp.example.com"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="smtp-port">SMTP port</Label>
          <Input
            id="smtp-port"
            type="number"
            min={1}
            max={65535}
            value={serverConfig.smtpPort}
            onChange={(e) =>
              setServerConfig((s) => ({ ...s, smtpPort: Number(e.target.value) }))
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="smtp-security">SMTP security</Label>
          <Select
            value={serverConfig.smtpSecurity}
            onValueChange={(v) =>
              setServerConfig((s) => ({
                ...s,
                smtpSecurity: v as AccountServerConfig["smtpSecurity"],
              }))
            }
          >
            <SelectTrigger id="smtp-security">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SECURITY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
