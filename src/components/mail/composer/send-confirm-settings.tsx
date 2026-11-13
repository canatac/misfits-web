"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_RECIPIENT_THRESHOLD,
  getRecipientThreshold,
  setRecipientThreshold,
} from "@/components/mail/composer/send-confirm-modal";

/**
 * Settings panel for the send confirmation threshold (issue #1059, AC5).
 *
 * Reads the threshold persisted by getRecipientThreshold() and writes it with
 * setRecipientThreshold(); the composer gate reads the same value.
 */
export function SendConfirmSettingsPanel() {
  const [value, setValue] = useState<number>(DEFAULT_RECIPIENT_THRESHOLD);

  useEffect(() => {
    setValue(getRecipientThreshold());
  }, []);

  const onSave = () => {
    setRecipientThreshold(value);
    setValue(getRecipientThreshold());
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-lg font-bold text-white">Confirmation d&apos;envoi</h2>
        <p className="text-sm text-[#71717A]">
          Demande une confirmation avant d&apos;envoyer un message au-delà d&apos;un certain
          nombre de destinataires.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="recipient-threshold"
          className="text-sm font-medium text-[#E0E0E0]"
        >
          Seuil de destinataires
        </label>
        <p className="text-xs text-[#71717A]">
          Au-dessus de ce nombre de destinataires (To + Cc + Bcc), une confirmation
          est demandée avant l&apos;envoi. Valeur par défaut : {DEFAULT_RECIPIENT_THRESHOLD}.
        </p>
        <div className="flex items-center gap-2">
          <input
            id="recipient-threshold"
            type="number"
            min={1}
            step={1}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-24 rounded-[var(--radius-md)] border border-[var(--color-input-border)] bg-[var(--color-input)] px-3 py-2 text-sm text-[var(--color-fg)] outline-none"
          />
          <Button size="sm" onClick={onSave}>
            Enregistrer
          </Button>
        </div>
        <p className="text-xs text-[#71717A]" data-testid="threshold-saved">
          Valeur enregistrée : {getRecipientThreshold()} destinataires.
        </p>
      </div>
    </div>
  );
}

export default SendConfirmSettingsPanel;
