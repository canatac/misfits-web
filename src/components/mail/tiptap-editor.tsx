"use client";

/**
 * Tiptap WYSIWYG editor for the composer.
 */
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import DOMPurify from "dompurify";
import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { SmartCompose } from "@/components/mail/smart-compose";
import { markdownToHtml } from "./tiptap-editor/markdown-to-html";
import { EditorToolbar } from "./tiptap-editor/EditorToolbar";
import {
  EDITOR_STYLES,
  SANITIZE_ATTRS,
  SANITIZE_TAGS,
} from "./tiptap-editor/config";

interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  className?: string;
  editable?: boolean;
  onToggleAI?: () => void;
  aiActive?: boolean;
  aiLoading?: boolean;
  onEditorReady?: (editor: Editor) => void;
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
      const clean = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: SANITIZE_TAGS,
        ALLOWED_ATTR: SANITIZE_ATTRS,
        ALLOW_DATA_ATTR: false,
      });
      onChange(clean);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== lastValueRef.current && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false);
      lastValueRef.current = value;
    }
  }, [value, editor]);

  useEffect(() => {
    if (editor && onEditorReady) onEditorReady(editor);
  }, [editor, onEditorReady]);

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
      <EditorToolbar
        editor={editor}
        insertLink={insertLink}
        insertImage={insertImage}
        isFullScreen={isFullScreen}
        onToggleFullScreen={onToggleFullScreen}
        onToggleAI={onToggleAI}
        aiActive={aiActive}
        aiLoading={aiLoading}
      />

      <EditorContent editor={editor} className="flex-1 overflow-auto" />

      <SmartCompose editor={editor} />

      <style>{EDITOR_STYLES}</style>
    </div>
  );
}

export type { Editor };
