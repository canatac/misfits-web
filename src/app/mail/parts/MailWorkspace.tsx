"use client";

import { EmailList } from "@/components/mail/email-list";
import { EmailView } from "@/components/mail/email-view";
import { ThreadView } from "@/components/mail/thread-view";
import { ChatPanel } from "@/components/mail/chat-panel";
import { cn } from "@/lib/utils";
import type { Thread } from "@/types/thread";

export interface MailWorkspaceProps {
  mobileView: "list" | "view";
  hasDesktopSelection: boolean;
  threadingEnabled: boolean;
  selectedThread: Thread | null;
  viewMode: "list" | "timeline";
  desktopChatOpen: boolean;
  onCloseChat: () => void;
}

export function MailWorkspace({
  mobileView,
  hasDesktopSelection,
  threadingEnabled,
  selectedThread,
  viewMode,
  desktopChatOpen,
  onCloseChat,
}: MailWorkspaceProps) {
  return (
    <>
      <div
        className={cn(
          "h-full w-full overflow-hidden rounded-2xl border border-[#202024] bg-[#0F0F11]/92 shadow-2xl",
          hasDesktopSelection ? "lg:w-80 xl:w-96" : "lg:flex-1",
          mobileView === "list" ? "block" : "hidden lg:block"
        )}
      >
        <EmailList />
      </div>

      <div
        className={cn(
          "h-full flex-1 overflow-hidden rounded-2xl border border-[#202024] bg-[#0F0F11]/92 shadow-2xl",
          mobileView === "view"
            ? hasDesktopSelection
              ? "block lg:block"
              : "block lg:hidden"
            : hasDesktopSelection
              ? "hidden lg:block"
              : "hidden lg:hidden"
        )}
      >
        {threadingEnabled && selectedThread ? (
          <ThreadView thread={selectedThread} viewMode={viewMode} />
        ) : (
          <EmailView />
        )}
      </div>

      <div
        className={cn(
          "hidden h-full shrink-0 overflow-hidden rounded-2xl border border-[#202024] bg-[#101012]/90 shadow-2xl transition-all duration-200 ease-out lg:block",
          desktopChatOpen ? "lg:w-[34rem]" : "lg:w-0"
        )}
      >
        {desktopChatOpen && (
          <ChatPanel layout="docked" onRequestClose={onCloseChat} />
        )}
      </div>
    </>
  );
}
