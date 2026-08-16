"use client";
import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTitle,
  ModalDescription,
} from "@/components/ui/modal";

export interface DeleteChangeRequestDialogProps {
  deleteDialogTarget: any;
  setDeleteDialogTarget: (v: any) => void;
  deleteChangeRequest: any;
  handleDeleteChangeRequestConfirm: () => void | Promise<void>;
}

export function DeleteChangeRequestDialog({
  deleteDialogTarget,
  setDeleteDialogTarget,
  deleteChangeRequest,
  handleDeleteChangeRequestConfirm,
}: DeleteChangeRequestDialogProps) {
  return (
    <Modal
      open={deleteDialogTarget !== null}
      onOpenChange={(open) => {
        if (!open) setDeleteDialogTarget(null);
      }}
    >
      <ModalContent className="max-w-md border-[#2A2A30] bg-[#151518] text-[#E4E4E7]">
        <ModalHeader>
          <ModalTitle>Supprimer cette change request ?</ModalTitle>
          <ModalDescription className="text-[#A1A1AA]">
            Cette action est définitive et ne peut pas être annulée.
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
          <div className="rounded-md border border-[#2A2A30] bg-[#111114] p-2 text-xs text-[#D4D4D8]">
            {deleteDialogTarget?.title || "Demande sans titre"}
          </div>
        </ModalBody>
        <ModalFooter className="gap-2">
          <button
            type="button"
            className="rounded-md border border-[#3A3A42] px-3 py-1.5 text-xs text-[#D4D4D8] disabled:opacity-50"
            onClick={() => setDeleteDialogTarget(null)}
            disabled={deleteChangeRequest.isPending}
          >
            Annuler
          </button>
          <button
            type="button"
            className="rounded-md border border-[#60292F] bg-[#2A1418] px-3 py-1.5 text-xs font-semibold text-[#FCA5A5] disabled:opacity-50"
            onClick={() => void handleDeleteChangeRequestConfirm()}
            disabled={deleteChangeRequest.isPending}
          >
            {deleteChangeRequest.isPending
              ? "Suppression..."
              : "Confirmer la suppression"}
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
