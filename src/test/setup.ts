// Polyfill ResizeObserver (required by cmdk)
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof global.ResizeObserver === "undefined") {
  global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
}

// Polyfill scrollIntoView (required by cmdk)
if (typeof HTMLElement !== "undefined" && !HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = function () {};
}
