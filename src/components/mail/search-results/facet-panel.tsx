"use client";

import { Filter, Paperclip, Star } from "lucide-react";
import { useSearchStore } from "@/stores/search-store";
import type { Folder } from "@/types/email";

export const FOLDER_NAMES: Record<Folder, string> = {
  inbox: "Inbox",
  sent: "Sent",
  drafts: "Drafts",
  archive: "Archive",
  trash: "Trash",
  spam: "Spam",
};

export function FacetPanel() {
  const facets = useSearchStore((s) => s.facets);
  const query = useSearchStore((s) => s.query);
  const setSearchQuery = useSearchStore((s) => s.setSearchQuery);
  const executeSearch = useSearchStore((s) => s.executeSearch);

  if (!facets || !query.trim()) return null;

  const folders = Object.entries(facets.folders).filter(
    ([, count]) => count > 0
  );
  const labels = Object.entries(facets.labels).filter(([, count]) => count > 0);

  const appendFilter = (operator: string, value: string) => {
    const newQuery = `${query} ${operator}:${value}`;
    setSearchQuery(newQuery);
    executeSearch();
  };

  const chip =
    "inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-2.5 py-1 text-xs transition-colors hover:bg-[var(--color-muted)]";

  return (
    <div className="flex flex-col gap-3 border-b border-[var(--color-border)] p-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--color-muted-fg)] uppercase">
        <Filter className="h-3.5 w-3.5" />
        Refine
      </div>

      <div className="flex flex-wrap gap-1.5">
        {facets.isUnread > 0 && (
          <button onClick={() => appendFilter("is", "unread")} className={chip}>
            Unread ({facets.isUnread})
          </button>
        )}
        {facets.isStarred > 0 && (
          <button onClick={() => appendFilter("is", "starred")} className={chip}>
            <Star className="h-3 w-3" />
            Starred ({facets.isStarred})
          </button>
        )}
        {facets.hasAttachment > 0 && (
          <button
            onClick={() => appendFilter("has", "attachment")}
            className={chip}
          >
            <Paperclip className="h-3 w-3" />
            Attachments ({facets.hasAttachment})
          </button>
        )}
      </div>

      {folders.length > 1 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--color-muted-fg)]">Folders</span>
          <div className="flex flex-wrap gap-1.5">
            {folders.map(([folder, count]) => (
              <button
                key={folder}
                onClick={() => appendFilter("", "")}
                className={chip}
                title={`Folder: ${FOLDER_NAMES[folder as Folder] ?? folder}`}
              >
                {FOLDER_NAMES[folder as Folder] ?? folder} ({count})
              </button>
            ))}
          </div>
        </div>
      )}

      {labels.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--color-muted-fg)]">Labels</span>
          <div className="flex flex-wrap gap-1.5">
            {labels.map(([label, count]) => (
              <button
                key={label}
                onClick={() =>
                  appendFilter("label", label.replace(/^label-/, ""))
                }
                className={chip}
              >
                {label.replace(/^label-/, "")} ({count})
              </button>
            ))}
          </div>
        </div>
      )}

      {(facets.dateRanges.today > 0 ||
        facets.dateRanges.week > 0 ||
        facets.dateRanges.month > 0) && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--color-muted-fg)]">Date</span>
          <div className="flex flex-wrap gap-1.5">
            {facets.dateRanges.today > 0 && (
              <button
                onClick={() => appendFilter("after", "1d")}
                className={chip}
              >
                Today ({facets.dateRanges.today})
              </button>
            )}
            {facets.dateRanges.week > 0 && (
              <button
                onClick={() => appendFilter("after", "7d")}
                className={chip}
              >
                This week ({facets.dateRanges.week})
              </button>
            )}
            {facets.dateRanges.month > 0 && (
              <button
                onClick={() => appendFilter("after", "30d")}
                className={chip}
              >
                This month ({facets.dateRanges.month})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
