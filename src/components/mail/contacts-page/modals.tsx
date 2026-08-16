"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import type { ContactInput } from "@/types/contact";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-[var(--color-muted-fg)]">
        {label}
      </span>
      {children}
    </label>
  );
}

export function AddContactModal({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdd: (input: ContactInput) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");

  const reset = () => {
    setName("");
    setEmail("");
    setCompany("");
    setRole("");
    setPhone("");
  };

  const valid = email.trim() && name.trim();

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent data-testid="add-contact-modal">
        <ModalHeader>
          <ModalTitle>Add contact</ModalTitle>
          <ModalDescription>Create a new contact record.</ModalDescription>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-3">
            <Field label="Name *">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
              />
            </Field>
            <Field label="Email *">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Company">
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Inc."
                />
              </Field>
              <Field label="Role">
                <Input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Engineer"
                />
              </Field>
            </div>
            <Field label="Phone">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 0100"
              />
            </Field>
          </div>
        </ModalBody>
        <ModalFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              onAdd({
                name: name.trim(),
                email: email.trim(),
                company: company.trim() || undefined,
                role: role.trim() || undefined,
                phone: phone.trim() || undefined,
              });
              reset();
              onOpenChange(false);
            }}
          >
            Add contact
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export function AddGroupModal({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdd: (name: string) => void;
}) {
  const [name, setName] = useState("");
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Add group</ModalTitle>
          <ModalDescription>
            Group contacts for easy filtering.
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
          <Field label="Group name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Investors"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  onAdd(name.trim());
                  setName("");
                  onOpenChange(false);
                }
              }}
            />
          </Field>
        </ModalBody>
        <ModalFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!name.trim()}
            onClick={() => {
              onAdd(name.trim());
              setName("");
              onOpenChange(false);
            }}
          >
            Add group
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
