import type { ReactNode } from "react";

export default function MailLayout({ children }: { children: ReactNode }) {
  // MailPage already owns the full workspace shell.
  // Keep layout as a transparent pass-through to avoid double wrapping
  // that visually fragments the inbox viewport.
  return children;
}
