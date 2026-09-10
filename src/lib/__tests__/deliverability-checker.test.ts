/**
 * Unit tests for deliverability checker.
 */
import { describe, it, expect } from "vitest";
import {
  validateSPF,
  validateDMARC,
  validateDKIM,
  validatePTR,
  validateTLS,
  validateTLSRPT,
  calculateComplianceScore,
  getComplianceStatus,
  runDeliverabilityCheck,
  getDeliverabilityStatusColor,
  getCheckStatusColor,
  getComplianceRequirements,
} from "@/lib/deliverability-checker";

describe("deliverability-checker", () => {
  describe("validateSPF", () => {
    it("passes valid SPF", () => {
      const result = validateSPF("v=spf1 include:_spf.misfits.ai ~all");
      expect(result.status).toBe("pass");
    });

    it("fails missing SPF", () => {
      const result = validateSPF(null);
      expect(result.status).toBe("fail");
    });

    it("warns on +all", () => {
      const result = validateSPF("v=spf1 +all");
      expect(result.status).toBe("warn");
    });
  });

  describe("validateDMARC", () => {
    it("passes p=reject", () => {
      const result = validateDMARC("v=DMARC1; p=reject");
      expect(result.status).toBe("pass");
    });

    it("warns on p=none", () => {
      const result = validateDMARC("v=DMARC1; p=none");
      expect(result.status).toBe("warn");
    });

    it("fails missing DMARC", () => {
      const result = validateDMARC(null);
      expect(result.status).toBe("fail");
    });
  });

  describe("validateDKIM", () => {
    it("passes valid DKIM", () => {
      const result = validateDKIM("default", "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A");
      expect(result.status).toBe("pass");
    });

    it("fails missing DKIM", () => {
      const result = validateDKIM("default", null);
      expect(result.status).toBe("fail");
    });
  });

  describe("validatePTR", () => {
    it("passes valid PTR", () => {
      const result = validatePTR("192.168.1.1", "mail.example.com");
      expect(result.status).toBe("pass");
    });

    it("fails missing PTR", () => {
      const result = validatePTR("192.168.1.1", null);
      expect(result.status).toBe("fail");
    });
  });

  describe("validateTLS", () => {
    it("passes valid TLS", () => {
      const result = validateTLS(true, true);
      expect(result.status).toBe("pass");
    });

    it("fails without STARTTLS", () => {
      const result = validateTLS(false, true);
      expect(result.status).toBe("fail");
    });

    it("fails with invalid cert", () => {
      const result = validateTLS(true, false);
      expect(result.status).toBe("fail");
    });
  });

  describe("validateTLSRPT", () => {
    it("passes valid TLS-RPT", () => {
      const result = validateTLSRPT("v=TLSRPTv1; rua=mailto:tlsrpt@example.com");
      expect(result.status).toBe("pass");
    });

    it("warns on missing TLS-RPT", () => {
      const result = validateTLSRPT(null);
      expect(result.status).toBe("warn");
    });
  });

  describe("calculateComplianceScore", () => {
    it("returns 100 for all pass", () => {
      const checks = [
        validateSPF("v=spf1 ~all"),
        validateDMARC("v=DMARC1; p=reject"),
        validateDKIM("sel", "v=DKIM1; k=rsa; p=key"),
        validatePTR("1.2.3.4", "mail.example.com"),
        validateTLS(true, true),
        validateTLSRPT("v=TLSRPTv1; rua=mailto:t@example.com"),
      ];
      expect(calculateComplianceScore(checks)).toBe(100);
    });

    it("returns 0 for all fail", () => {
      const checks = [
        validateSPF(null),
        validateDMARC(null),
        validateDKIM("sel", null),
        validatePTR("1.2.3.4", null),
        validateTLS(false, false),
        validateTLSRPT(null),
      ];
      expect(calculateComplianceScore(checks)).toBe(0);
    });
  });

  describe("getComplianceStatus", () => {
    it("returns compliant for 80+", () => {
      expect(getComplianceStatus(80)).toBe("compliant");
    });

    it("returns partial for 50-79", () => {
      expect(getComplianceStatus(60)).toBe("partial");
    });

    it("returns non-compliant for <50", () => {
      expect(getComplianceStatus(40)).toBe("non-compliant");
    });
  });

  describe("runDeliverabilityCheck", () => {
    it("runs full check", () => {
      const result = runDeliverabilityCheck("example.com", {
        spf: "v=spf1 ~all",
        dmarc: "v=DMARC1; p=reject",
        dkim: "v=DKIM1; k=rsa; p=key",
        ptr: "mail.example.com",
        hasSTARTTLS: true,
        certValid: true,
      });
      expect(result.domain).toBe("example.com");
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.status).toBeDefined();
    });
  });

  describe("getDeliverabilityStatusColor", () => {
    it("returns correct colors", () => {
      expect(getDeliverabilityStatusColor("compliant")).toBe("text-green-500");
      expect(getDeliverabilityStatusColor("non-compliant")).toBe("text-red-500");
    });
  });

  describe("getCheckStatusColor", () => {
    it("returns correct colors", () => {
      expect(getCheckStatusColor("pass")).toBe("text-green-500");
      expect(getCheckStatusColor("fail")).toBe("text-red-500");
    });
  });

  describe("getComplianceRequirements", () => {
    it("returns requirements list", () => {
      const reqs = getComplianceRequirements();
      expect(reqs.length).toBeGreaterThan(0);
      expect(reqs[0].requirement).toBeDefined();
    });
  });
});
