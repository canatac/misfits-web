/**
 * Unit tests for NIS2/DORA compliance audit framework.
 */
import { describe, it, expect } from "vitest";
import {
  createComplianceAudit,
  getControlsForFramework,
  assessControl,
  calculateOverallStatus,
  createSecurityIncident,
  reportIncident,
  isWithinReportingSLA,
  resolveIncident,
  createSupplyChainRisk,
  generateComplianceReport,
  getComplianceStatusColor,
  getIncidentSeverityColor,
  NIS2_CONTROLS,
  DORA_CONTROLS,
} from "@/lib/compliance-audit";

describe("compliance-audit", () => {
  describe("createComplianceAudit", () => {
    it("creates NIS2 audit", () => {
      const audit = createComplianceAudit("NIS2", "Auditor");
      expect(audit.framework).toBe("NIS2");
      expect(audit.controls.length).toBe(NIS2_CONTROLS.length);
      expect(audit.overallStatus).toBe("not-assessed");
    });

    it("creates DORA audit", () => {
      const audit = createComplianceAudit("DORA", "Auditor");
      expect(audit.framework).toBe("DORA");
      expect(audit.controls.length).toBe(DORA_CONTROLS.length);
    });
  });

  describe("getControlsForFramework", () => {
    it("returns NIS2 controls", () => {
      const controls = getControlsForFramework("NIS2");
      expect(controls.length).toBeGreaterThan(0);
      expect(controls[0].framework).toBe("NIS2");
    });

    it("returns DORA controls", () => {
      const controls = getControlsForFramework("DORA");
      expect(controls.length).toBeGreaterThan(0);
      expect(controls[0].framework).toBe("DORA");
    });
  });

  describe("assessControl", () => {
    it("assesses control as compliant", () => {
      const controls = getControlsForFramework("NIS2");
      const assessed = assessControl(controls[0], "compliant", "Evidence here");
      expect(assessed.status).toBe("compliant");
      expect(assessed.evidence).toBe("Evidence here");
    });

    it("assesses control with gaps", () => {
      const controls = getControlsForFramework("NIS2");
      const assessed = assessControl(controls[0], "partial", undefined, ["Gap 1"]);
      expect(assessed.status).toBe("partial");
      expect(assessed.gaps).toContain("Gap 1");
    });
  });

  describe("calculateOverallStatus", () => {
    it("returns compliant when all compliant", () => {
      const controls = getControlsForFramework("NIS2").map((c) =>
        assessControl(c, "compliant")
      );
      expect(calculateOverallStatus(controls)).toBe("compliant");
    });

    it("returns non-compliant when majority non-compliant", () => {
      const controls = getControlsForFramework("NIS2").map((c, i) =>
        assessControl(c, i < 3 ? "non-compliant" : "compliant")
      );
      expect(calculateOverallStatus(controls)).toBe("non-compliant");
    });

    it("returns partial otherwise", () => {
      const controls = getControlsForFramework("NIS2").map((c, i) =>
        assessControl(c, i === 0 ? "non-compliant" : "compliant")
      );
      expect(calculateOverallStatus(controls)).toBe("partial");
    });
  });

  describe("createSecurityIncident", () => {
    it("creates incident with open status", () => {
      const incident = createSecurityIncident({
        title: "Test Incident",
        description: "Test",
        severity: "high",
        affectedSystems: ["email"],
        impact: "Service degradation",
      });
      expect(incident.id).toBeDefined();
      expect(incident.status).toBe("open");
      expect(incident.severity).toBe("high");
    });
  });

  describe("reportIncident", () => {
    it("reports incident within 24h", () => {
      const incident = createSecurityIncident({
        title: "Test",
        description: "Test",
        severity: "medium",
        affectedSystems: ["api"],
        impact: "Minor",
      });
      const reported = reportIncident(incident);
      expect(reported.status).toBe("investigating");
      expect(reported.reportedAt).toBeDefined();
    });
  });

  describe("isWithinReportingSLA", () => {
    it("returns true for recent incident", () => {
      const incident = createSecurityIncident({
        title: "Test",
        description: "Test",
        severity: "low",
        affectedSystems: ["web"],
        impact: "None",
      });
      expect(isWithinReportingSLA(incident)).toBe(true);
    });
  });

  describe("resolveIncident", () => {
    it("resolves incident", () => {
      const incident = createSecurityIncident({
        title: "Test",
        description: "Test",
        severity: "low",
        affectedSystems: ["web"],
        impact: "None"
      });
      const resolved = resolveIncident(incident, "Root cause", "Fixed");
      expect(resolved.status).toBe("resolved");
      expect(resolved.rootCause).toBe("Root cause");
      expect(resolved.resolvedAt).toBeDefined();
    });
  });

  describe("createSupplyChainRisk", () => {
    it("creates risk entry", () => {
      const risk = createSupplyChainRisk({
        dependency: "test-lib",
        version: "1.0.0",
        riskLevel: "medium",
        category: "security",
        description: "Known vulnerability",
      });
      expect(risk.id).toBeDefined();
      expect(risk.riskLevel).toBe("medium");
    });
  });

  describe("generateComplianceReport", () => {
    it("generates report", () => {
      const audit = createComplianceAudit("NIS2", "Auditor");
      const report = generateComplianceReport(audit, [], []);
      expect(report.framework).toBe("NIS2");
      expect(report.controlsAssessed).toBe(NIS2_CONTROLS.length);
      expect(report.executiveSummary).toBeDefined();
    });
  });

  describe("getComplianceStatusColor", () => {
    it("returns correct colors", () => {
      expect(getComplianceStatusColor("compliant")).toBe("text-green-500");
      expect(getComplianceStatusColor("non-compliant")).toBe("text-red-500");
    });
  });

  describe("getIncidentSeverityColor", () => {
    it("returns correct colors", () => {
      expect(getIncidentSeverityColor("critical")).toBe("text-red-500");
      expect(getIncidentSeverityColor("low")).toBe("text-blue-500");
    });
  });
});
