import { describe, it, expect, beforeEach } from 'vitest';
import { AccountSignatureManager, createSignatureFromTemplate, insertVariables, Signature } from '../signature-manager';

describe('signature-manager', () => {
  let signatureManager: AccountSignatureManager;

  beforeEach(() => {
    signatureManager = new AccountSignatureManager();
  });

  describe('createSignature', () => {
    it('creates a signature with an id', () => {
      const sig = signatureManager.createSignature({
        accountId: 'acc-1',
        name: 'Work',
        body: 'Best, John',
        isDefault: false,
        variables: {},
      });
      expect(sig.id).toContain('sig-acc-1-');
      expect(sig.accountId).toBe('acc-1');
    });

    it('stores the signature retrievable by account', () => {
      signatureManager.createSignature({
        accountId: 'acc-1',
        name: 'Work',
        body: 'Best, John',
        isDefault: false,
        variables: {},
      });
      expect(signatureManager.getSignatures('acc-1')).toHaveLength(1);
    });
  });

  describe('getDefaultSignature', () => {
    it('returns undefined when no default exists', () => {
      expect(signatureManager.getDefaultSignature('acc-1')).toBeUndefined();
    });

    it('returns the default signature', () => {
      const sig = signatureManager.createSignature({
        accountId: 'acc-1',
        name: 'Default',
        body: 'Hi',
        isDefault: true,
        variables: {},
      });
      expect(signatureManager.getDefaultSignature('acc-1')?.id).toBe(sig.id);
    });
  });

  describe('updateSignature', () => {
    it('updates signature fields', () => {
      const sig = signatureManager.createSignature({
        accountId: 'acc-1',
        name: 'Work',
        body: 'Best, John',
        isDefault: false,
        variables: {},
      });
      const updated = signatureManager.updateSignature(sig.id, { body: 'Regards, John' });
      expect(updated?.body).toBe('Regards, John');
    });

    it('returns undefined for nonexistent id', () => {
      expect(signatureManager.updateSignature('nonexistent', { body: 'x' })).toBeUndefined();
    });
  });

  describe('deleteSignature', () => {
    it('deletes a signature', () => {
      const sig = signatureManager.createSignature({
        accountId: 'acc-1',
        name: 'Work',
        body: 'Best',
        isDefault: false,
        variables: {},
      });
      expect(signatureManager.deleteSignature(sig.id)).toBe(true);
      expect(signatureManager.getSignatures('acc-1')).toHaveLength(0);
    });

    it('returns false for nonexistent id', () => {
      expect(signatureManager.deleteSignature('nope')).toBe(false);
    });
  });

  describe('setDefault', () => {
    it('sets only one signature as default', () => {
      const a = signatureManager.createSignature({
        accountId: 'acc-1',
        name: 'A',
        body: 'a',
        isDefault: true,
        variables: {},
      });
      const b = signatureManager.createSignature({
        accountId: 'acc-1',
        name: 'B',
        body: 'b',
        isDefault: false,
        variables: {},
      });
      signatureManager.setDefault(b.id);
      expect(signatureManager.getDefaultSignature('acc-1')?.id).toBe(b.id);
    });
  });

  describe('renderSignature', () => {
    it('replaces variables in body', () => {
      const sig = signatureManager.createSignature({
        accountId: 'acc-1',
        name: 'Work',
        body: 'Hi {{name}}, from {{company}}',
        isDefault: false,
        variables: { name: 'John', company: 'Acme' },
      });
      const rendered = signatureManager.renderSignature(sig.id);
      expect(rendered).toBe('Hi John, from Acme');
    });

    it('merges runtime variables over stored', () => {
      const sig = signatureManager.createSignature({
        accountId: 'acc-1',
        name: 'Work',
        body: 'Hi {{name}}',
        isDefault: false,
        variables: {},
      });
      const rendered = signatureManager.renderSignature(sig.id, { name: 'Jane' });
      expect(rendered).toBe('Hi Jane');
    });

    it('returns undefined for nonexistent id', () => {
      expect(signatureManager.renderSignature('nope')).toBeUndefined();
    });
  });

  describe('createSignatureFromTemplate', () => {
    it('creates from template helper', () => {
      const sig = createSignatureFromTemplate('acc-2', 'Personal', 'Cheers!', true);
      expect(sig.accountId).toBe('acc-2');
      expect(sig.isDefault).toBe(true);
    });
  });

  describe('insertVariables', () => {
    it('replaces template variables', () => {
      const result = insertVariables('Hello {{name}}', { name: 'World' });
      expect(result).toBe('Hello World');
    });

    it('handles multiple variables', () => {
      const result = insertVariables('{{a}} and {{b}}', { a: '1', b: '2' });
      expect(result).toBe('1 and 2');
    });

    it('handles missing variables gracefully', () => {
      const result = insertVariables('Hello {{name}}', {});
      expect(result).toBe('Hello {{name}}');
    });
  });
});
