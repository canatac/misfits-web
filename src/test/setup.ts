if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'undefined') {
  (crypto as any).randomUUID = () => `test-uuid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// jsdom 25 does not implement matchMedia — provide a no-op mock for tests.
if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}
