"use client";

/**
 * MailPageOverlays — modals, overlays and floating panels stacked
 * above the mail workspace: composer modal, search overlay, mobile
 * chat overlay + trigger, terminal console, reminder banner and the
 * keyboard shortcut cheat sheet (MW-2026-122).
 */
import { useCallback, useEffect, useState } from "react";
import { ComposerPanel } from "@/components/mail/composer-panel";
import { SearchOverlay } from "@/components/mail/search-overlay";
import { ChatPanel } from "@/components/mail/chat-panel";
import { ChatTrigger } from "@/components/mail/chat-trigger";
import { ReminderBanner } from "@/components/mail/reminder-banner";
import { TerminalConsole } from "@/components/mail/terminal-console";
import { KeyboardShortcutsHelp } from "@/components/mail/keyboard-shortcuts-help";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalBody,
} from "@/components/ui/modal";
import { useI18n } from "@/i18n/provider";

interface MailPageOverlaysProps {
  composerOpen: boolean;
  closeComposer: () => void;
  searchOverlayOpen: boolean;
  setSearchOverlayOpen: (v: boolean) => void;
  isDesktop: boolean;
  chatOpen: boolean;
  setChatOpen: (v: boolean) => void;
  desktopConsoleOpen: boolean;
  setDesktopConsoleOpen: (v: boolean) => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

export function MailPageOverlays({
  composerOpen,
  closeComposer,
  searchOverlayOpen,
  setSearchOverlayOpen,
  isDesktop,
  chatOpen,
  setChatOpen,
  desktopConsoleOpen,
  setDesktopConsoleOpen,
}: MailPageOverlaysProps) {
  const { t } = useI18n();
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);

  const openShortcutsHelp = useCallback(() => setShortcutsHelpOpen(true), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "?" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      if (composerOpen || searchOverlayOpen) return;
      e.preventDefault();
      openShortcutsHelp();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [composerOpen, searchOverlayOpen, openShortcutsHelp]);

  return (
    <>
      <Modal
        open={composerOpen}
        onOpenChange={(o) => {
          if (!o) closeComposer();
        }}
      >
        <ModalContent className="max-w-3xl gap-0 p-0">
          <ModalHeader className="sr-only">
            <ModalTitle>{t("nav.compose")}</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <ComposerPanel onClose={closeComposer} />
          </ModalBody>
        </ModalContent>
      </Modal>

      <SearchOverlay
        open={searchOverlayOpen}
        onOpenChange={setSearchOverlayOpen}
      />

      {!isDesktop && chatOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[var(--color-overlay)]"
            onClick={() => setChatOpen(false)}
            aria-hidden="true"
          />
          <ChatPanel
            layout="overlay"
            onRequestClose={() => setChatOpen(false)}
          />
        </>
      )}
      {!isDesktop && <ChatTrigger />}

      <TerminalConsole
        isOpen={desktopConsoleOpen}
        onClose={() => setDesktopConsoleOpen(false)}
      />

      <ReminderBanner />

      <KeyboardShortcutsHelp
        open={shortcutsHelpOpen}
        onClose={() => setShortcutsHelpOpen(false)}
      />
    </>
  );
}
