export const EDITOR_STYLES = `
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
`;

export const SANITIZE_TAGS = [
  "p", "br", "div", "span", "a", "img", "ul", "ol", "li",
  "b", "strong", "i", "em", "u", "s", "del",
  "blockquote", "pre", "code", "h1", "h2", "h3", "hr",
];

export const SANITIZE_ATTRS = ["href", "src", "alt", "title", "target", "rel"];
