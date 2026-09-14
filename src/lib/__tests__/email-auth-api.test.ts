/**
 * Integration tests for email authentication monitoring API.
 *
 * Verifies frontend API client contract with backend deliverability endpoints.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock apiClient before importing the module under test
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { apiClient } from "@/lib/api-client";
import {
  getDeliverabilityDiagnostics,
  getAuthIncidents,
  acknowledgeIncident,
  refreshAuthChecks,
} from "../email-auth-api";

const mockGet = apiClient.get as ReturnType<typeof vi.fn>;
const mockPost = apiClient.post as ReturnType<typeof vi.fn>;

describe("email-auth-api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDeliverabilityDiagnostics", () => {
    it("fetches diagnostics with default 24h window", async () => {
      const response = {
        window: "24h",
        spf: { valid: true, record: "v=spf1 include:_spf.google.com ~all" },
        dkim: { valid: true, domains: ["example.com"] },
        dmarc: { valid: true, record: "v=DMARC1; p=quarantine;" },
      };
      mockGet.mockResolvedValue(response);

      const result = await getDeliverabilityDiagnostics();

      expect(mockGet).toHaveBeenCalledWith(
        "/admin/deliverability/diagnostics?window=24h"
      );
      expect(result).toEqual(response);
    });

    it("fetches diagnostics with custom window", async () => {
      mockGet.mockResolvedValue({ window: "7d" });

      await getDeliverabilityDiagnostics("7d");

      expect(mockGet).toHaveBeenCalledWith(
        "/admin/deliverability/diagnostics?window=7d"
      );
    });

    it("handles missing optional fields", async () => {
      const response = { window: "1h" };
      mockGet.mockResolvedValue(response);

      const result = await getDeliverabilityDiagnostics("1h");

      expect(result.spf).toBeUndefined();
      expect(result.dkim).toBeUndefined();
      expect(result.dmarc).toBeUndefined();
    });
  });

  describe("getAuthIncidents", () => {
    it("fetches incidents with default params", async () => {
      const response = { incidents: [], total: 0, page: 1, page_size: 50 };
      mockGet.mockResolvedValue(response);

      const result = await getAuthIncidents();

      expect(mockGet).toHaveBeenCalledWith("/admin/deliverability/incidents");
      expect(result.incidents).toEqual([]);
    });

    it("fetches incidents with pagination", async () => {
      const response = {
        incidents: [
          {
            id: "inc-1",
            ts: "2026-09-10T08:00:00Z",
            type: "spf",
            status: "fail",
            message: "SPF record missing",
            resolved: false,
          },
        ],
        total: 1,
        page: 1,
        page_size: 10,
      };
      mockGet.mockResolvedValue(response);

      const result = await getAuthIncidents({ window: "7d", page: 1, page_size: 10 });

      expect(mockGet).toHaveBeenCalledWith(
        "/admin/deliverability/incidents?window=7d&page=1&page_size=10"
      );
      expect(result.incidents).toHaveLength(1);
      expect(result.incidents[0].type).toBe("spf");
      expect(result.incidents[0].status).toBe("fail");
    });

    it("includes resolved incidents with timestamps", async () => {
      const response = {
        incidents: [
          {
            id: "inc-2",
            ts: "2026-09-09T10:00:00Z",
            type: "dkim",
            status: "fail",
            message: "DKIM signature invalid",
            resolved: true,
            resolved_at: "2026-09-09T11:00:00Z",
          },
        ],
        total: 1,
        page: 1,
        page_size: 50,
      };
      mockGet.mockResolvedValue(response);

      const result = await getAuthIncidents({ window: "24h" });

      expect(result.incidents[0].resolved).toBe(true);
      expect(result.incidents[0].resolved_at).toBe("2026-09-09T11:00:00Z");
    });
  });

  describe("acknowledgeIncident", () => {
    it("posts acknowledge request", async () => {
      mockPost.mockResolvedValue({ success: true, incident_id: "inc-1" });

      const result = await acknowledgeIncident("inc-1");

      expect(mockPost).toHaveBeenCalledWith(
        "/admin/deliverability/incidents/inc-1/acknowledge"
      );
      expect(result.success).toBe(true);
    });

    it("URL-encodes incident ID", async () => {
      mockPost.mockResolvedValue({ success: true, incident_id: "inc/1" });

      await acknowledgeIncident("inc/1");

      expect(mockPost).toHaveBeenCalledWith(
        "/admin/deliverability/incidents/inc%2F1/acknowledge"
      );
    });
  });

  describe("refreshAuthChecks", () => {
    it("triggers manual refresh", async () => {
      mockPost.mockResolvedValue({
        success: true,
        message: "Refresh initiated",
      });

      const result = await refreshAuthChecks();

      expect(mockPost).toHaveBeenCalledWith(
        "/admin/deliverability/refresh"
      );
      expect(result.success).toBe(true);
    });
  });

  describe("cross-repo contract with backend types", () => {
    it("AdminDeliverabilityDiagnosticsResponse matches backend shape", () => {
      const sample = {
        window: "24h",
        spf: { valid: true, record: "v=spf1 include:_spf.google.com ~all" },
        dkim: { valid: true, domains: ["example.com"] },
        dmarc: { valid: true, record: "v=DMARC1; p=reject;" },
        mx: { records: ["mail.example.com"] },
        bounces: { total: 5, rate: 0.02 },
      };

      expect(sample.window).toBeDefined();
      expect(sample.spf?.valid).toBe(true);
      expect(sample.dkim?.domains).toContain("example.com");
      expect(sample.dmarc?.valid).toBe(true);
      expect(sample.bounces?.rate).toBeLessThan(0.1);
    });
  });
});

describe("email-auth-api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDeliverabilityDiagnostics", () => {
    it("fetches diagnostics with default 24h window", async () => {
      const response = {
        window: "24h",
        spf: { valid: true, record: "v=spf1 include:_spf.google.com ~all" },
        dkim: { valid: true, domains: ["example.com"] },
        dmarc: { valid: true, record: "v=DMARC1; p=quarantine;" },
      };
      mockGet.mockResolvedValue(response);

      const result = await getDeliverabilityDiagnostics();

      expect(mockGet).toHaveBeenCalledWith(
        "/admin/deliverability/diagnostics?window=24h"
      );
      expect(result).toEqual(response);
    });

    it("fetches diagnostics with custom window", async () => {
      mockGet.mockResolvedValue({ window: "7d" });

      await getDeliverabilityDiagnostics("7d");

      expect(mockGet).toHaveBeenCalledWith(
        "/admin/deliverability/diagnostics?window=7d"
      );
    });

    it("handles missing optional fields", async () => {
      const response = { window: "1h" };
      mockGet.mockResolvedValue(response);

      const result = await getDeliverabilityDiagnostics("1h");

      expect(result.spf).toBeUndefined();
      expect(result.dkim).toBeUndefined();
      expect(result.dmarc).toBeUndefined();
    });
  });

  describe("getAuthIncidents", () => {
    it("fetches incidents with default params", async () => {
      const response = { incidents: [], total: 0, page: 1, page_size: 50 };
      mockGet.mockResolvedValue(response);

      const result = await getAuthIncidents();

      expect(mockGet).toHaveBeenCalledWith("/admin/deliverability/incidents");
      expect(result.incidents).toEqual([]);
    });

    it("fetches incidents with pagination", async () => {
      const response = {
        incidents: [
          {
            id: "inc-1",
            ts: "2026-09-10T08:00:00Z",
            type: "spf",
            status: "fail",
            message: "SPF record missing",
            resolved: false,
          },
        ],
        total: 1,
        page: 1,
        page_size: 10,
      };
      mockGet.mockResolvedValue(response);

      const result = await getAuthIncidents({ window: "7d", page: 1, page_size: 10 });

      expect(mockGet).toHaveBeenCalledWith(
        "/admin/deliverability/incidents?window=7d&page=1&page_size=10"
      );
      expect(result.incidents).toHaveLength(1);
      expect(result.incidents[0].type).toBe("spf");
      expect(result.incidents[0].status).toBe("fail");
    });

    it("includes resolved incidents with timestamps", async () => {
      const response = {
        incidents: [
          {
            id: "inc-2",
            ts: "2026-09-09T10:00:00Z",
            type: "dkim",
            status: "fail",
            message: "DKIM signature invalid",
            resolved: true,
            resolved_at: "2026-09-09T11:00:00Z",
          },
        ],
        total: 1,
        page: 1,
        page_size: 50,
      };
      mockGet.mockResolvedValue(response);

      const result = await getAuthIncidents({ window: "24h" });

      expect(result.incidents[0].resolved).toBe(true);
      expect(result.incidents[0].resolved_at).toBe("2026-09-09T11:00:00Z");
    });
  });

  describe("acknowledgeIncident", () => {
    it("posts acknowledge request", async () => {
      mockPost.mockResolvedValue({ success: true, incident_id: "inc-1" });

      const result = await acknowledgeIncident("inc-1");

      expect(mockPost).toHaveBeenCalledWith(
        "/admin/deliverability/incidents/inc-1/acknowledge"
      );
      expect(result.success).toBe(true);
    });

    it("URL-encodes incident ID", async () => {
      mockPost.mockResolvedValue({ success: true, incident_id: "inc/1" });

      await acknowledgeIncident("inc/1");

      expect(mockPost).toHaveBeenCalledWith(
        "/admin/deliverability/incidents/inc%2F1/acknowledge"
      );
    });
  });

  describe("refreshAuthChecks", () => {
    it("triggers manual refresh", async () => {
      mockPost.mockResolvedValue({
        success: true,
        message: "Refresh initiated",
      });

      const result = await refreshAuthChecks();

      expect(mockPost).toHaveBeenCalledWith(
        "/admin/deliverability/refresh"
      );
      expect(result.success).toBe(true);
    });
  });

  describe("cross-repo contract with backend types", () => {
    it("AdminDeliverabilityDiagnosticsResponse matches backend shape", () => {
      const sample = {
        window: "24h",
        spf: { valid: true, record: "v=spf1 include:_spf.google.com ~all" },
        dkim: { valid: true, domains: ["example.com"] },
        dmarc: { valid: true, record: "v=DMARC1; p=reject;" },
        mx: { records: ["mail.example.com"] },
        bounces: { total: 5, rate: 0.02 },
      };

      expect(sample.window).toBeDefined();
      expect(sample.spf?.valid).toBe(true);
      expect(sample.dkim?.domains).toContain("example.com");
      expect(sample.dmarc?.valid).toBe(true);
      expect(sample.bounces?.rate).toBeLessThan(0.1);
    });
  });
});
