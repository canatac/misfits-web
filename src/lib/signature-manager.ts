// Per-account email signature manager
// Issue #480: Per-account email signature manager

export interface Signature {
  id: string;
  accountId: string;
  name: string;
  body: string;
  isDefault: boolean;
  variables: Record<string, string>;
}

export interface SignatureManager {
  getSignatures(accountId: string): Signature[];
  getDefaultSignature(accountId: string): Signature | undefined;
  createSignature(signature: Omit<Signature, 'id'>): Signature;
  updateSignature(id: string, updates: Partial<Signature>): Signature | undefined;
  deleteSignature(id: string): boolean;
  setDefault(id: string): void;
  renderSignature(id: string, variables?: Record<string, string>): string | undefined;
}

export class AccountSignatureManager implements SignatureManager {
  private signatures: Map<string, Signature[]> = new Map();

  getSignatures(accountId: string): Signature[] {
    return this.signatures.get(accountId) ?? [];
  }

  getDefaultSignature(accountId: string): Signature | undefined {
    return this.getSignatures(accountId).find((s) => s.isDefault);
  }

  createSignature(signature: Omit<Signature, 'id'>): Signature {
    const id = `sig-${signature.accountId}-${Date.now()}`;
    const newSig: Signature = { ...signature, id };
    const accountSigs = this.signatures.get(signature.accountId) ?? [];
    accountSigs.push(newSig);
    this.signatures.set(signature.accountId, accountSigs);
    return newSig;
  }

  updateSignature(id: string, updates: Partial<Signature>): Signature | undefined {
    for (const [accountId, sigs] of this.signatures) {
      const idx = sigs.findIndex((s) => s.id === id);
      if (idx !== -1) {
        sigs[idx] = { ...sigs[idx], ...updates, id };
        this.signatures.set(accountId, sigs);
        return sigs[idx];
      }
    }
    return undefined;
  }

  deleteSignature(id: string): boolean {
    for (const [accountId, sigs] of this.signatures) {
      const idx = sigs.findIndex((s) => s.id === id);
      if (idx !== -1) {
        sigs.splice(idx, 1);
        return true;
      }
    }
    return false;
  }

  setDefault(id: string): void {
    for (const [accountId, sigs] of this.signatures) {
      const sig = sigs.find((s) => s.id === id);
      if (sig) {
        sigs.forEach((s) => { s.isDefault = s.id === id; });
        this.signatures.set(accountId, sigs);
        break;
      }
    }
  }

  renderSignature(id: string, variables?: Record<string, string>): string | undefined {
    for (const sigs of this.signatures.values()) {
      const sig = sigs.find((s) => s.id === id);
      if (sig) {
        let body = sig.body;
        const vars = { ...sig.variables, ...variables };
        for (const [key, value] of Object.entries(vars)) {
          body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
        }
        return body;
      }
    }
    return undefined;
  }
}

export const signatureManager = new AccountSignatureManager();

export function createSignatureFromTemplate(
  accountId: string,
  name: string,
  body: string,
  isDefault = false
): Signature {
  return signatureManager.createSignature({
    accountId,
    name,
    body,
    isDefault,
    variables: {},
  });
}

export function insertVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}
