"use client";

import { ChevronDown, ChevronRight, Download, FileText, FolderOpen } from "lucide-react";
import { formatBytes, type WorkspaceNode } from "@/lib/file-workspace";

export function FileTree({
  node,
  expanded,
  onToggle,
}: {
  node: WorkspaceNode;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}) {
  const isOpen = expanded.has(node.id);
  return (
    <div className="pl-3">
      <button
        type="button"
        onClick={() => onToggle(node.id)}
        className="flex w-full items-center gap-1 rounded px-1 py-1 text-left text-sm text-[#D4D4D8] hover:bg-[#1A1A1D]"
      >
        {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        <FolderOpen className="h-3.5 w-3.5 text-[#C49B66]" />
        <span>{node.name}</span>
      </button>

      {isOpen && (
        <div className="ml-4 border-l border-[#242427]">
          {node.children.map((child) => (
            <FileTree key={child.id} node={child} expanded={expanded} onToggle={onToggle} />
          ))}
          {node.files.map((file) => (
            <div
              key={file.id}
              className="ml-2 flex items-center justify-between gap-2 rounded px-2 py-1 text-xs text-[#A1A1AA] hover:bg-[#1A1A1D]"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-[#E4E4E7]">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="truncate">{file.name}</span>
                </div>
                <div className="truncate">
                  {file.subject} · {formatBytes(file.size)} · {file.owner}
                </div>
              </div>
              {file.downloadUrl ? (
                <a
                  href={file.downloadUrl}
                  className="inline-flex items-center gap-1 rounded border border-[#2A2A2D] px-2 py-1 text-[11px] text-[#C49B66] hover:bg-[#242427]"
                >
                  <Download className="h-3 w-3" />
                  Ouvrir
                </a>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
