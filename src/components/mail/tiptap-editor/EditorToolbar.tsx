"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  Unlink,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { AIToolbarButton } from "@/components/mail/ai-toolbar-button";
import { ToolbarButton } from "./ToolbarButton";

export interface EditorToolbarProps {
  editor: Editor;
  insertLink: () => void;
  insertImage: () => void;
  isFullScreen: boolean;
  onToggleFullScreen?: () => void;
  onToggleAI?: () => void;
  aiActive?: boolean;
  aiLoading?: boolean;
}

export function EditorToolbar({
  editor,
  insertLink,
  insertImage,
  isFullScreen,
  onToggleFullScreen,
  onToggleAI,
  aiActive,
  aiLoading,
}: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--color-border)] px-2 py-1.5">
      <ToolbarButton
        icon={Bold}
        label="Bold (Ctrl+B)"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon={Italic}
        label="Italic (Ctrl+I)"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        icon={UnderlineIcon}
        label="Underline (Ctrl+U)"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolbarButton
        icon={Strikethrough}
        label="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <Separator orientation="vertical" className="mx-0.5 h-6" />
      <ToolbarButton
        icon={Heading1}
        label="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
      />
      <ToolbarButton
        icon={Heading2}
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      />
      <Separator orientation="vertical" className="mx-0.5 h-6" />
      <ToolbarButton
        icon={List}
        label="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        icon={ListOrdered}
        label="Ordered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        icon={Quote}
        label="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        icon={Code}
        label="Inline code"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />
      <Separator orientation="vertical" className="mx-0.5 h-6" />
      <ToolbarButton
        icon={LinkIcon}
        label="Insert link"
        active={editor.isActive("link")}
        onClick={insertLink}
      />
      <ToolbarButton
        icon={Unlink}
        label="Remove link"
        disabled={!editor.isActive("link")}
        onClick={() => editor.chain().focus().unsetLink().run()}
      />
      <ToolbarButton
        icon={ImageIcon}
        label="Insert image"
        onClick={insertImage}
      />
      {onToggleAI && (
        <>
          <Separator orientation="vertical" className="mx-0.5 h-6" />
          <AIToolbarButton
            active={aiActive}
            loading={aiLoading}
            onClick={onToggleAI}
          />
        </>
      )}
      <div className="ml-auto">
        {onToggleFullScreen && (
          <ToolbarButton
            icon={isFullScreen ? Minimize2 : Maximize2}
            label={isFullScreen ? "Exit full screen" : "Full screen"}
            onClick={onToggleFullScreen}
          />
        )}
      </div>
    </div>
  );
}
