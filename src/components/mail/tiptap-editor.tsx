"use client";

/**
 * Tiptap WYSIWYG editor for the composer.
 *
 * Toolbar: bold, italic, underline, strikethrough, bullet list, ordered list,
 * blockquote, code, link, heading (H1/H2), plus image insert and a full-screen
 * toggle. Outputs clean HTML via DOMPurify. Supports markdown input (paste/type
 * markdown that is converted to HTML on the fly for headings/bold/italic).
 */
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import DOMPurify from "dompurify";
import { useCallback, useEffect, useRef } from "react";
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
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { AIToolbarButton } from "@/components/mail/ai-toolbar-button";
import { SmartCompose } from "@/components/mail/smart-compose";

interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  className?: string;
  editable?: boolean;
  /** Toggle the AI composer panel (shown in the editor toolbar). */
  onToggleAI?: () => void;
  /** Whether the AI panel is currently open. */
  aiActive?: boolean;
  /** Show the AI loading animation while a generation is in flight. */
  aiLoading?: boolean;
  /** Notifies the parent once the editor instance is ready (for AI insertion). */
  onEditorReady?: (editor: Editor) => void;
}

/** Minimal markdown → HTML for common inline/block constructs. */
function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let inList = false;
  let inOrdered = false;
  let inQuote = false;
  const inline = (s: string) =>
    s
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
    if (inOrdered) {
      html.push("</ol>");
      inOrdered = false;
    }
  };
  const closeQuote = () => {
    if (inQuote) {
      html.push("</blockquote>");
      inQuote = false;
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^#{1}\s+/.test(line)) {
      closeList();
      closeQuote();
      html.push(`<h1>${inline(line.replace(/^#{1}\s+/, ""))}</h1>`);
    } else if (/^#{2}\s+/.test(line)) {
      closeList();
      closeQuote();
      html.push(`<h2>${inline(line.replace(/^#{2}\s+/, ""))}</h2>`);
    } else if (/^>\s?/.test(line)) {
      closeList();
      if (!inQuote) {
        html.push("<blockquote>");
        inQuote = true;
      }
      html.push(`<p>${inline(line.replace(/^>\s?/, ""))}</p>`);
    } else if (/^[-*]\s+/.test(line)) {
      closeQuote();
      if (inOrdered) {
        html.push("</ol>");
        inOrdered = false;
      }
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`);
    } else if (/^\d+\.\s+/.test(line)) {
      closeQuote();
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      if (!inOrdered) {
        html.push("<ol>");
        inOrdered = true;
      }
      html.push(`<li>${inline(line.replace(/^\d+\.\s+/, ""))}</li>`);
    } else if (line.trim() === "") {
      closeList();
      closeQuote();
    } else {
      closeList();
      html.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList();
  closeQuote();
  return html.join("");
}

function ToolbarButton({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: typeof Bold;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          onClick={onClick}
          className={cn(
            "h-8 w-8",
            active && "bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
          )}
          aria-label={label}
          aria-pressed={active}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export function TiptapEditor({
  value,
  onChange,
  placeholder = "Write your email…",
  isFullScreen = false,
  onToggleFullScreen,
  className,
  editable = true,
  onToggleAI,
  aiActive,
  aiLoading,
  onEditorReady,
}: TiptapEditorProps) {
  const lastValueRef = useRef(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
        codeBlock: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose-mail min-h-[200px] max-w-none px-4 py-3 text-sm text-[var(--color-fg)] outline-none focus:outline-none",
      },
      handlePaste: (view, event) => {
        // Paste image from clipboard.
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = () => {
                const src = reader.result as string;
                view.dispatch(
                  view.state.tr.replaceSelectionWith(
                    view.state.schema.nodes.image.create({ src })
                  )
                );
              };
              reader.readAsDataURL(file);
              event.preventDefault();
              return true;
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      lastValueRef.current = html;
      // Sanitize output before sending up.
      const clean = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          "p",
          "br",
          "div",
          "span",
          "a",
          "img",
          "ul",
          "ol",
          "li",
          "b",
          "strong",
          "i",
          "em",
          "u",
          "s",
          "del",
          "blockquote",
          "pre",
          "code",
          "h1",
          "h2",
          "h3",
          "hr",
        ],
        ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel"],
        ALLOW_DATA_ATTR: false,
      });
      onChange(clean);
    },
  });

  // Keep editor in sync when value changes externally (e.g. reply/template load).
  useEffect(() => {
    if (!editor) return;
    if (value !== lastValueRef.current && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false);
      lastValueRef.current = value;
    }
  }, [value, editor]);

  // Notify the parent once the editor instance is ready (for AI insertion).
  useEffect(() => {
    if (editor && onEditorReady) onEditorReady(editor);
  }, [editor, onEditorReady]);

  // Keyboard: Cmd/Ctrl+Shift+M converts a markdown line to HTML.
  const handleMarkdownConvert = useCallback(() => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, "\n");
    if (text) {
      const html = markdownToHtml(text);
      editor.chain().focus().deleteSelection().insertContent(html).run();
    }
  }, [editor]);

  const insertLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const insertImage = useCallback(() => {
    if (!editor) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        editor
          .chain()
          .focus()
          .setImage({ src: reader.result as string })
          .run();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [editor]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "m"
      ) {
        e.preventDefault();
        handleMarkdownConvert();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleMarkdownConvert]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "flex flex-col rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-input)]",
        isFullScreen &&
          "fixed inset-0 z-[var(--z-modal)] rounded-none border-0",
        className
      )}
      data-testid="tiptap-editor"
    >
      {/* Toolbar */}
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

      {/* Editor surface */}
      <EditorContent editor={editor} className="flex-1 overflow-auto" />

      {/* Smart compose ghost-text autocomplete */}
      <SmartCompose editor={editor} />

      {/* Placeholder styling */}
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--color-muted-fg);
          pointer-events: none;
          height: 0;
        }
        .ProseMirror:focus { outline: none; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 1.5rem; }
        .ProseMirror blockquote {
          border-left: 3px solid var(--color-border);
          padding-left: 0.75rem;
          margin-left: 0;
          color: var(--color-muted-fg);
        }
        .ProseMirror pre {
          background: var(--color-muted);
          border-radius: var(--radius-md);
          padding: 0.5rem 0.75rem;
        }
        .ProseMirror code { background: var(--color-muted); padding: 0.1rem 0.3rem; border-radius: var(--radius-sm); }
        .ProseMirror pre code { background: transparent; padding: 0; }
        .ProseMirror img { max-width: 100%; border-radius: var(--radius-md); }
        .ProseMirror h1 { font-size: 1.5rem; font-weight: 700; }
        .ProseMirror h2 { font-size: 1.25rem; font-weight: 600; }
      `}</style>
    </div>
  );
}

export type { Editor };
