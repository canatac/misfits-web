if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'undefined') {
  (crypto as any).randomUUID = () => `test-uuid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
