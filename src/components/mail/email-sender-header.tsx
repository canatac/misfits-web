// email-sender-header.tsx — Section header d'un email (avatar + from + to + cc + date).
// Extrait de email-view.tsx (refactor architecte) pour clean code:
// - Composant pur, sans état, sans effet
// - Testable isolément
// - Contient l'affichage du sender + destinataires + date

import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, formatFullDate } from "./email-view-utils";

type MailRecipient = { name: string; address?: string };
type MailSender = { name: string; address: string };
interface EmailSenderHeaderProps {
  email: {
    from: MailSender;
    to: MailRecipient[];
    cc?: MailRecipient[];
    date: string;
  };
}

export function EmailSenderHeader({ email }: EmailSenderHeaderProps) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <Avatar className="h-10 w-10">
        <AvatarFallback>{getInitials(email.from.name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-medium text-[var(--color-fg)]">
            {email.from.name}
          </span>
          <span className="text-sm text-[var(--color-muted-fg)]">
            &lt;{email.from.address}&gt;
          </span>
        </div>
        <div className="text-sm text-[var(--color-muted-fg)]">
          to{" "}
          {email.to.map((r: { name: string }, i: number) => (
            <span key={i}>
              {i > 0 && ", "}
              {r.name}
            </span>
          ))}
          {email.cc && email.cc.length > 0 && (
            <>
              {" · cc "}
              {email.cc.map((r: { name: string }, i: number) => (
                <span key={i}>
                  {i > 0 && ", "}
                  {r.name}
                </span>
              ))}
            </>
          )}
        </div>
      </div>
      <span className="shrink-0 text-sm text-[var(--color-muted-fg)]">
        {formatFullDate(email.date)}
      </span>
    </div>
  );
}
