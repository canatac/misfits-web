"use client";

import type { AdminAuditEntry } from "@/lib/admin-ops-api";
import type { AdminUserRecord } from "@/types/admin-ops";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { asDate } from "../../shared";

interface UserDeleteModalProps {
  target: AdminUserRecord | null;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function UserDeleteModal({
  target,
  isPending,
  onClose,
  onConfirm,
}: UserDeleteModalProps) {
  return (
    <Modal
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <ModalContent className="max-w-md border-[#2A2A30] bg-[#151518] text-[#E4E4E7]">
        <ModalHeader>
          <ModalTitle>Supprimer cet utilisateur ?</ModalTitle>
          <ModalDescription className="text-[#A1A1AA]">
            Cette suppression est définitive et ne peut pas être annulée.
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
          <div className="rounded-md border border-[#2A2A30] bg-[#111114] p-2 text-xs text-[#D4D4D8]">
            {target?.displayName || target?.email}
            <br />
            <span className="text-[#71717A]">{target?.email}</span>
          </div>
        </ModalBody>
        <ModalFooter className="gap-2">
          <button
            type="button"
            className="rounded-md border border-[#3A3A42] px-3 py-1.5 text-xs text-[#D4D4D8] disabled:opacity-50"
            onClick={onClose}
            disabled={isPending}
          >
            Annuler
          </button>
          <button
            type="button"
            className="rounded-md border border-[#60292F] bg-[#2A1418] px-3 py-1.5 text-xs font-semibold text-[#FCA5A5] disabled:opacity-50"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Suppression..." : "Confirmer la suppression"}
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

interface UserResetPasswordModalProps {
  target: AdminUserRecord | null;
  passwordDraft: string;
  revokeSessions: boolean;
  isPending: boolean;
  onChangePasswordDraft: (value: string) => void;
  onChangeRevokeSessions: (value: boolean) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function UserResetPasswordModal({
  target,
  passwordDraft,
  revokeSessions,
  isPending,
  onChangePasswordDraft,
  onChangeRevokeSessions,
  onClose,
  onConfirm,
}: UserResetPasswordModalProps) {
  return (
    <Modal
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <ModalContent className="max-w-md border-[#2A2A30] bg-[#151518] text-[#E4E4E7]">
        <ModalHeader>
          <ModalTitle>Réinitialiser le mot de passe</ModalTitle>
          <ModalDescription className="text-[#A1A1AA]">
            Laisser vide pour générer un mot de passe temporaire.
          </ModalDescription>
        </ModalHeader>
        <ModalBody className="space-y-3">
          <div>
            <p className="mb-1 text-xs text-[#A1A1AA]">Utilisateur</p>
            <div className="rounded-md border border-[#2A2A30] bg-[#111114] p-2 text-xs text-[#D4D4D8]">
              {target?.displayName || target?.email}
            </div>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs text-[#A1A1AA]">Nouveau mot de passe (optionnel)</span>
            <input
              type="password"
              value={passwordDraft}
              onChange={(event) => onChangePasswordDraft(event.target.value)}
              className="w-full rounded-md border border-[#2A2A30] bg-[#111114] px-2 py-1.5 text-xs text-[#D4D4D8]"
              placeholder="Laisser vide pour auto-génération"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-[#D4D4D8]">
            <input
              type="checkbox"
              checked={revokeSessions}
              onChange={(event) => onChangeRevokeSessions(event.target.checked)}
            />
            Révoquer les sessions actives
          </label>
        </ModalBody>
        <ModalFooter className="gap-2">
          <button
            type="button"
            className="rounded-md border border-[#3A3A42] px-3 py-1.5 text-xs text-[#D4D4D8] disabled:opacity-50"
            onClick={onClose}
            disabled={isPending}
          >
            Annuler
          </button>
          <button
            type="button"
            className="rounded-md border border-[#3B4A1F] bg-[#1B2310] px-3 py-1.5 text-xs font-semibold text-[#BEF264] disabled:opacity-50"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Réinitialisation..." : "Confirmer la réinitialisation"}
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

interface UserActivityModalProps {
  target: AdminUserRecord | null;
  linkedAuditEntries: AdminAuditEntry[];
  onClose: () => void;
}

export function UserActivityModal({
  target,
  linkedAuditEntries,
  onClose,
}: UserActivityModalProps) {
  return (
    <Modal
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <ModalContent className="max-w-2xl border-[#2A2A30] bg-[#151518] text-[#E4E4E7]">
        <ModalHeader>
          <ModalTitle>Activité utilisateur</ModalTitle>
          <ModalDescription className="text-[#A1A1AA]">
            {target?.displayName || target?.email}
          </ModalDescription>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <div>
            <p className="mb-2 text-xs text-[#A1A1AA]">Timeline (recentActivity)</p>
            <div className="space-y-1">
              {(target?.recentActivity ?? []).length > 0 ? (
                target?.recentActivity.map((evt, idx) => (
                  <p key={`${target?.id}_${idx}`} className="rounded-md bg-[#111114] px-2 py-1 text-xs text-[#D4D4D8]">
                    {asDate(evt.at)} · {evt.kind} · {evt.label}
                  </p>
                ))
              ) : (
                <p className="text-xs text-[#71717A]">Aucune activité récente.</p>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs text-[#A1A1AA]">Journal d&apos;audit lié</p>
            <div className="space-y-1">
              {linkedAuditEntries.length > 0 ? (
                linkedAuditEntries.map((entry) => (
                  <p key={entry.id} className="rounded-md bg-[#111114] px-2 py-1 text-xs text-[#D4D4D8]">
                    {asDate(entry.at)} · {entry.action} · {entry.actorEmail}
                    <span className="text-[#71717A]"> ({entry.targetKind}:{entry.targetId})</span>
                  </p>
                ))
              ) : (
                <p className="text-xs text-[#71717A]">Aucune entrée d&apos;audit liée.</p>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <button
            type="button"
            className="rounded-md border border-[#3A3A42] px-3 py-1.5 text-xs text-[#D4D4D8]"
            onClick={onClose}
          >
            Fermer
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
