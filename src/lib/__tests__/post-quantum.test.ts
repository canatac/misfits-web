/**
 * Unit tests for post-quantum cryptography utilities.
 */
import { describe, it, expect } from "vitest";
import {
  PQC_CONFIG,
  getSecurityLevelDescription,
  getSecurityBadgeColor,
  isPostQuantumSecure,
  generateHybridKeyPair,
  createInitialPQStatus,
  migrateToPostQuantum,
} from "@/lib/post-quantum";

describe("post-quantum", () => {
  describe("getSecurityLevelDescription", () => {
    it("returns classic description", () => {
      expect(getSecurityLevelDescription("classic")).toBe("Standard encryption (PGP)");
    });

    it("returns hybrid description", () => {
      expect(getSecurityLevelDescription("hybrid")).toBe("Hybrid encryption (PGP + Post-quantum)");
    });

    it("returns post-quantum-secure description", () => {
      expect(getSecurityLevelDescription("post-quantum-secure")).toBe("Post-quantum secure (Kyber + Dilithium)");
    });
  });

  describe("getSecurityBadgeColor", () => {
    it("returns gray for classic", () => {
      expect(getSecurityBadgeColor("classic")).toBe("text-gray-500");
    });

    it("returns yellow for hybrid", () => {
      expect(getSecurityBadgeColor("hybrid")).toBe("text-yellow-500");
    });

    it("returns green for post-quantum-secure", () => {
      expect(getSecurityBadgeColor("post-quantum-secure")).toBe("text-green-500");
    });
  });

  describe("isPostQuantumSecure", () => {
    it("returns true for kyber-1024", () => {
      expect(isPostQuantumSecure("kyber-1024")).toBe(true);
    });

    it("returns true for kyber-768", () => {
      expect(isPostQuantumSecure("kyber-768")).toBe(true);
    });

    it("returns false for kyber-512", () => {
      expect(isPostQuantumSecure("kyber-512")).toBe(false);
    });

    it("returns true for dilithium-5", () => {
      expect(isPostQuantumSecure("dilithium-5")).toBe(true);
    });

    it("returns false for dilithium-2", () => {
      expect(isPostQuantumSecure("dilithium-2")).toBe(false);
    });
  });

  describe("generateHybridKeyPair", () => {
    it("generates a hybrid key pair", () => {
      const keyPair = generateHybridKeyPair("classic-key-1");
      expect(keyPair.classicKeyId).toBe("classic-key-1");
      expect(keyPair.securityLevel).toBe("hybrid");
      expect(keyPair.pqKey.algorithm).toBe("kyber");
      expect(keyPair.pqKey.variant).toBe("kyber-1024");
      expect(keyPair.pqKey.isPrimary).toBe(true);
    });

    it("uses custom variants", () => {
      const keyPair = generateHybridKeyPair("classic-key-1", "kyber-768", "dilithium-3");
      expect(keyPair.pqKey.variant).toBe("kyber-768");
    });
  });

  describe("createInitialPQStatus", () => {
    it("creates initial status with classic security", () => {
      const status = createInitialPQStatus();
      expect(status.enabled).toBe(false);
      expect(status.keys).toHaveLength(0);
      expect(status.migrationState).toBe("not-started");
      expect(status.securityIndicator).toBe("classic");
    });
  });

  describe("migrateToPostQuantum", () => {
    it("migrates account to hybrid security", () => {
      const initial = createInitialPQStatus();
      const migrated = migrateToPostQuantum(initial, "classic-key-1");
      expect(migrated.enabled).toBe(true);
      expect(migrated.keys).toHaveLength(1);
      expect(migrated.migrationState).toBe("completed");
      expect(migrated.securityIndicator).toBe("hybrid");
    });

    it("preserves existing keys", () => {
      const initial = createInitialPQStatus();
      const first = migrateToPostQuantum(initial, "key-1");
      const second = migrateToPostQuantum(first, "key-2");
      expect(second.keys).toHaveLength(2);
    });
  });

  describe("PQC_CONFIG", () => {
    it("has correct default variants", () => {
      expect(PQC_CONFIG.defaultKyber).toBe("kyber-1024");
      expect(PQC_CONFIG.defaultDilithium).toBe("dilithium-5");
    });

    it("has correct security levels for kyber", () => {
      expect(PQC_CONFIG.kyberSecurity["kyber-1024"].nistLevel).toBe(5);
      expect(PQC_CONFIG.kyberSecurity["kyber-768"].nistLevel).toBe(3);
      expect(PQC_CONFIG.kyberSecurity["kyber-512"].nistLevel).toBe(1);
    });

    it("has correct security levels for dilithium", () => {
      expect(PQC_CONFIG.dilithiumSecurity["dilithium-5"].nistLevel).toBe(5);
      expect(PQC_CONFIG.dilithiumSecurity["dilithium-3"].nistLevel).toBe(3);
      expect(PQC_CONFIG.dilithiumSecurity["dilithium-2"].nistLevel).toBe(2);
    });
  });
});
