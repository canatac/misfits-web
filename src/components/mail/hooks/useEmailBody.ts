"use client";

import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { QUOTE_PATTERNS } from "@/components/mail/email-view-utils";
import type { Email } from "@/types/email";

/** Sanitize + process body: block/allow images, collapse quoted replies. */
export function useEmailBody(email: Email | null) {
  const [loadImages, setLoadImages] = useState(false);
  const [showQuoted, setShowQuoted] = useState(false);
  const [hasQuoted, setHasQuoted] = useState(false);

  useEffect(() => {
    setLoadImages(false);
    setShowQuoted(false);
    if (email) {
      setHasQuoted(QUOTE_PATTERNS.some((p: RegExp) => p.test(email.body)));
    } else {
      setHasQuoted(false);
    }
  }, [email]);

  const sanitizedBody = useMemo(() => {
    if (!email) return "";
    if (email.bodyType === "text") {
      const escaped = email.body
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return escaped.replace(/\n/g, "<br>");
    }
    return DOMPurify.sanitize(email.body, {
      ALLOWED_TAGS: [
        "p", "br", "div", "span", "a", "img", "ul", "ol", "li",
        "b", "strong", "i", "em", "u", "s", "del", "blockquote",
        "pre", "code", "h1", "h2", "h3", "h4", "h5", "h6",
        "table", "thead", "tbody", "tr", "th", "td", "hr", "sub", "sup",
      ],
      ALLOWED_ATTR: [
        "href", "src", "alt", "title", "style", "class", "id", "target",
        "colspan", "rowspan",
      ],
      ALLOW_DATA_ATTR: false,
    });
  }, [email]);

  const processedBody = useMemo(() => {
    let body = sanitizedBody;
    if (!loadImages) {
      body = body.replace(
        /<img([^>]*?)\ssrc=(["']?)(https?:\/\/[^"'\s>]+)(["']?)([^>]*)>/gi,
        (_m, pre: string, _q1: string, src: string, _q2: string, post: string) =>
          `<img${pre} data-blocked-src="${src}" alt="Image blocked" ${post}>`
      );
    } else {
      body = body.replace(
        /<img([^>]*?)\sdata-blocked-src=(["']?)([^"'\s>]+)(["']?)([^>]*)>/gi,
        (_m, pre: string, _q1: string, src: string, _q2: string, post: string) =>
          `<img${pre} src="${src}" ${post}>`
      );
    }
    if (hasQuoted && !showQuoted) {
      for (const pattern of QUOTE_PATTERNS) {
        if (pattern.test(body)) {
          body = body.replace(
            pattern,
            '<div class="quoted-collapsed" style="border:1px solid var(--color-border);border-radius:var(--radius-md);padding:0.5rem 1rem;color:var(--color-muted-fg);font-size:0.875rem;cursor:pointer;">... Show quoted text ...</div>'
          );
          break;
        }
      }
    }
    return body;
  }, [sanitizedBody, loadImages, showQuoted, hasQuoted]);

  return {
    loadImages,
    setLoadImages,
    showQuoted,
    setShowQuoted,
    hasQuoted,
    processedBody,
  };
}
