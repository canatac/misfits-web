"use client";

import { useState, useCallback } from "react";
import { useAccountStore } from "@/stores/account-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Check, AlertCircle, Copy, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  generateBimiRecord,
  validateSvgLogo,
  getBimiDnsRecordName,
} from "@/lib/bimi";

const BIMI_REQUIREMENTS = [
  "SVG format (square, minimum 144x144 pixels)",
  "HTTPS URL required for logo hosting",
  "DMARC policy must be quarantine or reject",
  "VMC (Verified Mark Certificate) recommended for Gmail/Yahoo",
];

export default function BimiSettingsPage() {
  const accounts = useAccountStore((s) => s.accounts);
  const [domain, setDomain] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoValid, setLogoValid] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeAccount = accounts.find((a) => a.isActive);
  const accountDomain = activeAccount?.email?.split("@")[1] || "";

  const effectiveDomain = domain || accountDomain;

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.name.endsWith(".svg")) {
        setLogoError("Only SVG files are accepted");
        setLogoValid(false);
        setLogoPreview(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const validation = validateSvgLogo(content);
        if (!validation.valid) {
          setLogoError(validation.errors.join(", "));
          setLogoValid(false);
        } else {
          setLogoError(null);
          setLogoValid(true);
        }
        setLogoPreview(content);
      };
      reader.readAsText(file);
    },
    []
  );

  const bimiRecord = effectiveDomain
    ? generateBimiRecord({ domain: effectiveDomain })
    : "";
  const dnsRecordName = effectiveDomain
    ? getBimiDnsRecordName(effectiveDomain)
    : "";

  const handleCopy = async () => {
    if (!bimiRecord) return;
    await navigator.clipboard.writeText(bimiRecord);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6" data-testid="bimi-settings-page">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-fg)]">
          BIMI Configuration
        </h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          Configure your brand logo for verified email display
        </p>
      </div>

      {/* Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-[var(--color-brand-500)]" />
            BIMI Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm text-[var(--color-muted-fg)]">
            {BIMI_REQUIREMENTS.map((req, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[var(--color-brand-500)]">•</span>
                {req}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Domain */}
      <Card>
        <CardHeader>
          <CardTitle>Domain</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder={accountDomain || "example.com"}
            className="max-w-md"
            data-testid="bimi-domain-input"
          />
          <p className="mt-1 text-xs text-[var(--color-muted-fg)]">
            Leave empty to use your account domain ({accountDomain || "none"})
          </p>
        </CardContent>
      </Card>

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Logo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed",
                logoValid
                  ? "border-green-500 bg-green-500/10"
                  : logoError
                    ? "border-red-500 bg-red-500/10"
                    : "border-[var(--color-border)] bg-[var(--color-muted)]"
              )}
            >
              {logoPreview ? (
                <div
                  className="h-full w-full p-2"
                  dangerouslySetInnerHTML={{ __html: logoPreview }}
                />
              ) : (
                <Upload className="h-8 w-8 text-[var(--color-muted-fg)]" />
              )}
            </div>
            <div className="flex-1">
              <Input
                type="file"
                accept=".svg"
                onChange={handleFileChange}
                data-testid="bimi-logo-upload"
              />
              {logoError && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  {logoError}
                </p>
              )}
              {logoValid && (
                <p className="mt-1 flex items-center gap-1 text-xs text-green-500">
                  <Check className="h-3 w-3" />
                  Valid SVG logo
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DNS Record */}
      {effectiveDomain && (
        <Card>
          <CardHeader>
            <CardTitle>DNS Record</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-sm text-[var(--color-muted-fg)]">
              Add this TXT record to your DNS zone:
            </p>
            <div className="rounded-lg bg-[var(--color-muted)] p-3 font-mono text-sm">
              <div className="text-[var(--color-brand-500)]">
                {dnsRecordName}
              </div>
              <div className="mt-1 break-all text-[var(--color-fg)]">
                {bimiRecord}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleCopy}
              data-testid="bimi-copy-dns"
            >
              {copied ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy DNS Record"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
