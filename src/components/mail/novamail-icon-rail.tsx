"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ShieldCheck,
  Inbox,
  Send,
  FilePen,
  ShieldAlert,
  Trash2,
  Sparkles,
  Star,
  Calendar,
  Folder,
  Newspaper,
  LogOut,
  SquarePen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEmailStore } from "@/stores/email-store";
import { useLogoutAction } from "@/hooks/use-auth";
import type { Folder as MailFolder } from "@/types/email";

interface NovaMailIconRailProps {
  onCompose: () => void;
}

function RailButton({
  active,
  title,
  onClick,
  children,
  danger,
}: {
  active?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl p-2.5 transition-all relative hover:bg-[#1D1D20]/50 hover:text-white",
        active && "bg-[#1D1D20] text-[#C49B66] border border-[#C49B66]/40",
        danger && "hover:text-rose-400",
      )}
      title={title}
      aria-label={title}
    >
      {children}
    </button>
  );
}

export function NovaMailIconRail({ onCompose }: NovaMailIconRailProps) {
  const pathname = usePathname();
  const router = useRouter();
  const currentFolder = useEmailStore((s) => s.currentFolder);
  const filterType = useEmailStore((s) => s.filterType);
  const setFolder = useEmailStore((s) => s.setFolder);
  const setFilterType = useEmailStore((s) => s.setFilterType);
  const setSearchQuery = useEmailStore((s) => s.setSearchQuery);
  const logout = useLogoutAction();

  const openFolder = useCallback(
    (folder: MailFolder) => {
      setSearchQuery("");
      setFilterType("all");
      setFolder(folder);
      router.push("/mail");
    },
    [router, setFilterType, setFolder, setSearchQuery],
  );

  const openPriority = useCallback(() => {
    setSearchQuery("");
    setFolder("inbox");
    setFilterType("unread");
    router.push("/mail");
  }, [router, setFilterType, setFolder, setSearchQuery]);

  const openStarred = useCallback(() => {
    setSearchQuery("");
    setFolder("inbox");
    setFilterType("starred");
    router.push("/mail");
  }, [router, setFilterType, setFolder, setSearchQuery]);

  return (
    <aside className="hidden w-16 shrink-0 flex-col items-center gap-1 border-r border-[#242427] bg-[#121214] py-3 text-[#71717A] lg:flex">
      <button
        type="button"
        onClick={onCompose}
        className="rounded-xl bg-[#C49B66] p-3 font-extrabold text-[#0A0A0B] shadow-lg transition-all hover:bg-[#b08855]"
        title="Compose Message"
        aria-label="Compose Message"
      >
        <SquarePen className="h-5 w-5" />
      </button>

      <div className="my-0.5 h-[1px] w-8 bg-[#242427]" />

      <RailButton active={pathname.startsWith("/dashboard")} title="Dashboard Matinal" onClick={() => router.push("/dashboard")}>
        <LayoutDashboard className="h-5 w-5 text-[#C49B66]" />
      </RailButton>
      <RailButton active={pathname.startsWith("/docs")} title="Manuel d'utilisation (Docs)" onClick={() => router.push("/docs")}>
        <BookOpen className="h-5 w-5 text-[#C49B66]" />
      </RailButton>
      <RailButton active={pathname.startsWith("/admin")} title="Console Admin (Grafana & LLM Builder)" onClick={() => router.push("/admin")}>
        <ShieldCheck className="h-5 w-5 text-[#C49B66]" />
      </RailButton>

      <RailButton active={pathname.startsWith("/mail") && currentFolder === "inbox" && filterType === "all"} title="Boîte de réception" onClick={() => openFolder("inbox")}>
        <Inbox className="h-5 w-5 text-[#C49B66]" />
      </RailButton>
      <RailButton active={pathname.startsWith("/mail") && currentFolder === "sent"} title="Envoyés" onClick={() => openFolder("sent")}>
        <Send className="h-5 w-5 text-[#C49B66]" />
      </RailButton>
      <RailButton active={pathname.startsWith("/mail") && currentFolder === "drafts"} title="Brouillons" onClick={() => openFolder("drafts")}>
        <FilePen className="h-5 w-5 text-[#71717A]" />
      </RailButton>
      <RailButton active={pathname.startsWith("/mail") && currentFolder === "spam"} title="Spam" onClick={() => openFolder("spam")}>
        <ShieldAlert className="h-5 w-5 text-rose-400" />
      </RailButton>
      <RailButton active={pathname.startsWith("/mail") && currentFolder === "trash"} title="Corbeille" onClick={() => openFolder("trash")}>
        <Trash2 className="h-5 w-5 text-[#71717A]" />
      </RailButton>
      <RailButton active={pathname.startsWith("/mail") && currentFolder === "inbox" && filterType === "unread"} title="Prioritaires" onClick={openPriority}>
        <Sparkles className="h-5 w-5 text-[#C49B66]" />
      </RailButton>
      <RailButton active={pathname.startsWith("/mail") && currentFolder === "inbox" && filterType === "starred"} title="Starred" onClick={openStarred}>
        <Star className="h-5 w-5 text-[#71717A]" />
      </RailButton>

      <div className="my-1 h-[1px] w-8 bg-[#242427]" />

      <RailButton active={pathname.startsWith("/calendar")} title="Calendar" onClick={() => router.push("/calendar")}>
        <Calendar className="h-5 w-5 text-[#71717A]" />
      </RailButton>
      <RailButton active={pathname.startsWith("/files")} title="Files" onClick={() => router.push("/files")}>
        <Folder className="h-5 w-5 text-[#71717A]" />
      </RailButton>
      <RailButton active={pathname.startsWith("/newsletters")} title="Newsletters" onClick={() => router.push("/newsletters")}>
        <Newspaper className="h-5 w-5 text-[#71717A]" />
      </RailButton>

      <div className="mt-auto">
        <RailButton title="Logout" onClick={logout} danger>
          <LogOut className="h-5 w-5" />
        </RailButton>
      </div>
    </aside>
  );
}
