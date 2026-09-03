"use client";

import { EmailList } from "@/components/mail/email-list";
import { EmailView } from "@/components/mail/email-view";
import { ThreadView } from "@/components/mail/thread-view";
import { ChatPanel } from "@/components/mail/chat-panel";
import { cn } from "@/lib/utils";
import type { Thread } from "@/types/thread";
import { X } from "lucide-react";

export interface MailWorkspaceProps {
  mobileView: "list" | "view";
  hasDesktopSelection: boolean;
  threadingEnabled: boolean;
  selectedThread: Thread | null;
  viewMode: "list" | "timeline";
  desktopChatOpen: boolean;
  onCloseChat: () => void;
  onCloseDetail: () => void;
}

export function MailWorkspace({
  mobileView,
  hasDesktopSelection,
  threadingEnabled,
  selectedThread,
  viewMode,
  desktopChatOpen,
  onCloseChat,
  onCloseDetail,
}: MailWorkspaceProps) {
  return (
    <>
      <div
        data-testid="mail-list-pane"
        className={cn(
          "h-full w-full overflow-hidden rounded-2xl border border-[#202024] bg-[#0F0F11]/92 shadow-2xl",
          hasDesktopSelection
            ? "lg:w-80 xl:w-96 2xl:w-[30rem] lg:shrink-0"
            : "lg:flex-1 lg:w-full",
          mobileView === "list" ? "block" : "hidden lg:block"
        )}
      >
        <EmailList />
      </div>

      <div
        data-testid="mail-detail-pane"
        className={cn(
          "relative h-full flex-1 overflow-hidden rounded-2xl border border-[#202024] bg-[#0F0F11]/92 shadow-2xl",
          hasDesktopSelection
            ? mobileView === "view"
              ? "block lg:block"
              : "hidden lg:block"
            : "hidden"
        )}
      >
        {hasDesktopSelection && (
          <button
            type="button"
            aria-label="Fermer le détail du mail"
            onClick={onCloseDetail}
            className="absolute top-3 right-3 z-20 inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#2A2A2E] bg-[#141417] text-[#A1A1AA] transition hover:bg-[#1C1C20] hover:text-[#E4E4E7]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {hasDesktopSelection &&
          (threadingEnabled && selectedThread ? (
            <ThreadView thread={selectedThread} viewMode={viewMode} />
          ) : (
            <EmailView />
          ))}
      </div>

      <div
        className={cn(
          "hidden h-full shrink-0 overflow-hidden rounded-2xl border border-[#202024] bg-[#101012]/90 shadow-2xl transition-all duration-200 ease-out lg:block",
          hasDesktopSelection && desktopChatOpen
            ? "lg:w-[34rem]"
            : "lg:w-0 lg:border-transparent"
        )}
      >
        {hasDesktopSelection && desktopChatOpen && (
          <ChatPanel layout="docked" onRequestClose={onCloseChat} />
        )}
      </div>
    </>
  );
}
