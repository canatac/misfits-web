import type { ReactNode } from "react";

export default function MailLayout({ children }: { children: ReactNode }) {
  // MailPage already renders the full workspace shell.
  // Keep route layout transparent to avoid nested shell wrappers that
  // fragment the inbox viewport.
  return children;
}
