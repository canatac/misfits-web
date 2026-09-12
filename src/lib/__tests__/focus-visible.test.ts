import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initFocusVisible, isKeyboardFocusActive } from "@/lib/focus-visible";

function mockDom() {
  const docEl = document.documentElement;
  const listeners: Record<string, Function[]> = {};

  const addEventListener = (type: string, fn: Function) => {
    listeners[type] = listeners[type] || [];
    listeners[type].push(fn);
  };
  const removeEventListener = (type: string, fn: Function) => {
    listeners[type] = (listeners[type] || []).filter((f) => f !== fn);
  };

  vi.spyOn(document, "addEventListener").mockImplementation(addEventListener as any);
  vi.spyOn(document, "removeEventListener").mockImplementation(removeEventListener as any);

  return {
    fire(type: string, event: any = {}) {
      (listeners[type] || []).forEach((fn) => fn(event));
    },
    docEl,
  };
}

describe("focus-visible", () => {
  beforeEach(() => {
    document.documentElement.className = "";
    document.documentElement.removeAttribute("style");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets is-keyboard-focus class on Tab keydown", () => {
    const dom = mockDom();
    initFocusVisible();
    dom.fire("keydown", { key: "Tab" });
    expect(dom.docEl.classList.contains("is-keyboard-focus")).toBe(true);
    expect(isKeyboardFocusActive()).toBe(true);
  });

  it("removes is-keyboard-focus class on pointerdown", () => {
    const dom = mockDom();
    initFocusVisible();
    dom.fire("keydown", { key: "Tab" });
    dom.fire("pointerdown", {});
    expect(dom.docEl.classList.contains("is-keyboard-focus")).toBe(false);
    expect(isKeyboardFocusActive()).toBe(false);
  });

  it("adds focus-visible-ring class to focused element after keyboard nav", () => {
    const dom = mockDom();
    const btn = document.createElement("button");
    document.body.appendChild(btn);
    vi.spyOn(document, "activeElement", "get").mockReturnValue(btn);

    initFocusVisible();
    dom.fire("keydown", { key: "Tab" });
    dom.fire("focusin", {});

    expect(btn.classList.contains("focus-visible-ring")).toBe(true);
    document.body.removeChild(btn);
  });

  it("does NOT add focus-visible-ring class for pointer focus", () => {
    const dom = mockDom();
    const btn = document.createElement("button");
    document.body.appendChild(btn);
    vi.spyOn(document, "activeElement", "get").mockReturnValue(btn);

    initFocusVisible();
    dom.fire("focusin", {});

    expect(btn.classList.contains("focus-visible-ring")).toBe(false);
    document.body.removeChild(btn);
  });

  it("cleanup removes listeners and resets state", () => {
    const dom = mockDom();
    const cleanup = initFocusVisible();
    dom.fire("keydown", { key: "Tab" });
    cleanup();
    expect(dom.docEl.classList.contains("is-keyboard-focus")).toBe(false);
    expect(isKeyboardFocusActive()).toBe(false);
  });
});
