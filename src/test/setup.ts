if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'undefined') {
  (crypto as any).randomUUID = () => `test-uuid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

if (typeof window.matchMedia === 'undefined') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
      onchange: null,
    }) as unknown as MediaQueryList;
}
