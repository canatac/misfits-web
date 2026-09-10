/**
 * NIS2/DORA compliance audit and reporting framework (Issue #513).
 *
 * Provides compliance auditing, incident reporting (24h SLA),
 * supply chain risk assessment, and automated compliance report generation.
 */

export type ComplianceFramework = "NIS2" | "DORA" | "CRA";

export type ComplianceStatus = "compliant" | "partial" | "non-compliant" | "not-assessed";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type IncidentStatus = "open" | "investigating" | "contained" | "resolved" | "closed";

export interface ComplianceControl {
  id: string;
  framework: ComplianceFramework;
  category: string;
  requirement: string;
  description: string;
  status: ComplianceStatus;
  evidence?: string;
  gaps?: string[];
  remediation?: string;
  priority: "P0" | "P1" | "P2";
  owner: string;
  dueDate?: string;
}

export interface ComplianceAudit {
  id: string;
  framework: ComplianceFramework;
  auditDate: string;
  auditor: string;
  controls: ComplianceControl[];
  overallStatus: ComplianceStatus;
  findings: string[];
  recommendations: string[];
}

export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  detectedAt: string;
  reportedAt?: string;
  resolvedAt?: string;
  affectedSystems: string[];
  impact: string;
  rootCause?: string;
  remediation?: string;
  lessonsLearned?: string;
}

export interface SupplyChainRisk {
  id: string;
  dependency: string;
  version: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  category: "security" | "availability" | "compliance" | "maintenance";
  description: string;
  mitigation?: string;
  lastAssessed: string;
}

export interface ComplianceReport {
  id: string;
  generatedAt: string;
  framework: ComplianceFramework;
  overallStatus: ComplianceStatus;
  controlsAssessed: number;
  controlsCompliant: number;
  controlsPartial: number;
  controlsNonCompliant: number;
  openIncidents: number;
  supplyChainRisks: number;
  executiveSummary: string;
  findings: string[];
  recommendations: string[];
  nextAuditDate: string;
}

export const NIS2_CONTROLS: Omit<ComplianceControl, "id" | "status">[] = [
  {
    framework: "NIS2",
    category: "Risk Management",
    requirement: "A.1",
    description: "Appropriate and proportionate technical, operational and organisational measures",
    priority: "P0",
    owner: "Security Team",
  },
  {
    framework: "NIS2",
    category: "Incident Handling",
    requirement: "A.2",
    description: "Incident handling procedures and 24h reporting SLA",
    priority: "P0",
    owner: "Security Team",
  },
  {
    framework: "NIS2",
    category: "Business Continuity",
    requirement: "A.3",
    description: "Business continuity and crisis management",
    priority: "P1",
    owner: "Operations",
  },
  {
    framework: "NIS2",
    category: "Supply Chain Security",
    requirement: "A.4",
    description: "Supply chain security and dependency management",
    priority: "P1",
    owner: "Engineering",
  },
  {
    framework: "NIS2",
    category: "Security Assessment",
    requirement: "A.5",
    description: "Regular security assessments and audits",
    priority: "P1",
    owner: "Security Team",
  },
];

export const DORA_CONTROLS: Omit<ComplianceControl, "id" | "status">[] = [
  {
    framework: "DORA",
    category: "ICT Risk Management",
    requirement: "RTS 1",
    description: "ICT risk management framework",
    priority: "P0",
    owner: "Security Team",
  },
  {
    framework: "DORA",
    category: "Incident Reporting",
    requirement: "RTS 2",
    description: "Incident detection, classification and reporting",
    priority: "P0",
    owner: "Security Team",
  },
  {
    framework: "DORA",
    category: "Digital Operational Resilience",
    requirement: "RTS 3",
    description: "Testing and scenario-based exercises",
    priority: "P1",
    owner: "Engineering",
  },
  {
    framework: "DORA",
    category: "Third-Party Risk",
    requirement: "RTS 4",
    description: "ICT third-party risk and concentration risk",
    priority: "P1",
    owner: "Procurement",
  },
];

/**
 * Create a compliance audit for a framework.
 */
export function createComplianceAudit(
  framework: ComplianceFramework,
  auditor: string
): ComplianceAudit {
  const controls = getControlsForFramework(framework);

  return {
    id: `audit-${Date.now()}`,
    framework,
    auditDate: new Date().toISOString(),
    auditor,
    controls,
    overallStatus: "not-assessed",
    findings: [],
    recommendations: [],
  };
}

/**
 * Get controls for a framework.
 */
export function getControlsForFramework(
  framework: ComplianceFramework
): ComplianceControl[] {
  const controls = framework === "NIS2" ? NIS2_CONTROLS : DORA_CONTROLS;
  return controls.map((c, i) => ({
    ...c,
    id: `${framework}-${i}`,
    status: "not-assessed",
  }));
}

/**
 * Assess a control's compliance status.
 */
export function assessControl(
  control: ComplianceControl,
  status: ComplianceStatus,
  evidence?: string,
  gaps?: string[]
): ComplianceControl {
  return {
    ...control,
    status,
    evidence,
    gaps,
  };
}

/**
 * Calculate overall compliance status.
 */
export function calculateOverallStatus(controls: ComplianceControl[]): ComplianceStatus {
  if (controls.length === 0) return "not-assessed";

  const compliant = controls.filter((c) => c.status === "compliant").length;
  const nonCompliant = controls.filter((c) => c.status === "non-compliant").length;

  if (compliant === controls.length) return "compliant";
  if (nonCompliant > controls.length / 2) return "non-compliant";
  return "partial";
}

/**
 * Create a security incident.
 */
export function createSecurityIncident(options: {
  title: string;
  description: string;
  severity: IncidentSeverity;
  affectedSystems: string[];
  impact: string;
}): SecurityIncident {
  return {
    id: `inc-${Date.now()}`,
    ...options,
    status: "open",
    detectedAt: new Date().toISOString(),
  };
}

/**
 * Report an incident (24h SLA).
 */
export function reportIncident(incident: SecurityIncident): SecurityIncident {
  return {
    ...incident,
    status: "investigating",
    reportedAt: new Date().toISOString(),
  };
}

/**
 * Check if incident is within 24h reporting SLA.
 */
export function isWithinReportingSLA(incident: SecurityIncident): boolean {
  const detected = new Date(incident.detectedAt).getTime();
  const now = Date.now();
  const hoursSinceDetection = (now - detected) / (1000 * 60 * 60);
  return hoursSinceDetection <= 24;
}

/**
 * Resolve an incident.
 */
export function resolveIncident(
  incident: SecurityIncident,
  rootCause: string,
  remediation: string
): SecurityIncident {
  return {
    ...incident,
    status: "resolved",
    resolvedAt: new Date().toISOString(),
    rootCause,
    remediation,
  };
}

/**
 * Create a supply chain risk entry.
 */
export function createSupplyChainRisk(options: {
  dependency: string;
  version: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  category: "security" | "availability" | "compliance" | "maintenance";
  description: string;
  mitigation?: string;
}): SupplyChainRisk {
  return {
    id: `risk-${Date.now()}`,
    ...options,
    lastAssessed: new Date().toISOString(),
  };
}

/**
 * Generate a compliance report.
 */
export function generateComplianceReport(
  audit: ComplianceAudit,
  incidents: SecurityIncident[],
  supplyChainRisks: SupplyChainRisk[]
): ComplianceReport {
  const controlsCompliant = audit.controls.filter((c) => c.status === "compliant").length;
  const controlsPartial = audit.controls.filter((c) => c.status === "partial").length;
  const controlsNonCompliant = audit.controls.filter((c) => c.status === "non-compliant").length;

  const openIncidents = incidents.filter(
    (i) => i.status !== "resolved" && i.status !== "closed"
  ).length;

  const nextAuditDate = new Date();
  nextAuditDate.setFullYear(nextAuditDate.getFullYear() + 1);

  return {
    id: `report-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    framework: audit.framework,
    overallStatus: calculateOverallStatus(audit.controls),
    controlsAssessed: audit.controls.length,
    controlsCompliant,
    controlsPartial,
    controlsNonCompliant,
    openIncidents,
    supplyChainRisks: supplyChainRisks.length,
    executiveSummary: generateExecutiveSummary(audit, incidents, supplyChainRisks),
    findings: audit.findings,
    recommendations: audit.recommendations,
    nextAuditDate: nextAuditDate.toISOString(),
  };
}

/**
 * Generate executive summary for compliance report.
 */
function generateExecutiveSummary(
  audit: ComplianceAudit,
  incidents: SecurityIncident[],
  supplyChainRisks: SupplyChainRisk[]
): string {
  const status = calculateOverallStatus(audit.controls);
  const criticalRisks = supplyChainRisks.filter((r) => r.riskLevel === "critical").length;
  const openIncidents = incidents.filter((i) => i.status !== "resolved").length;

  return `Compliance Status: ${status.toUpperCase()}. ` +
    `${audit.controls.length} controls assessed. ` +
    `${openIncidents} open incidents. ` +
    `${criticalRisks} critical supply chain risks identified.`;
}

/**
 * Get compliance status color for UI.
 */
export function getComplianceStatusColor(status: ComplianceStatus): string {
  const colors: Record<ComplianceStatus, string> = {
    compliant: "text-green-500",
    partial: "text-yellow-500",
    "non-compliant": "text-red-500",
    "not-assessed": "text-gray-500",
  };
  return colors[status];
}

/**
 * Get incident severity color for UI.
 */
export function getIncidentSeverityColor(severity: IncidentSeverity): string {
  const colors: Record<IncidentSeverity, string> = {
    low: "text-blue-500",
    medium: "text-yellow-500",
    high: "text-orange-500",
    critical: "text-red-500",
  };
  return colors[severity];
}

/**
 * Get risk level color for UI.
 */
export function getRiskLevelColor(level: string): string {
  const colors: Record<string, string> = {
    low: "text-green-500",
    medium: "text-yellow-500",
    high: "text-orange-500",
    critical: "text-red-500",
  };
  return colors[level] || "text-gray-500";
}
