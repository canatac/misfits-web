// dashboard-fixtures.ts
// TODO Sprint 5: Replace with real API calls
// These are placeholder data for UI development

export interface VeilleItem {
  id: string; title: string; signal: number; tags: string[];
  summary: string; takeaways?: string[];
}
export interface TaskItem {
  id: string; label: string; ref?: string; details?: string;
  due?: string; priority?: "high" | "medium" | "low";
}
export interface AlertItem {
  id: string; title: string; description: string; time: string; cta: string;
  bg?: string; border?: string; accent?: string;
}
export const VEILLE: VeilleItem[] = [
  {
    id: "v1",
    title: "The Byte Report",
    signal: 92,
    tags: ["#IA", "#MachineLearning"],
    summary:
      "Latest issue dives into the new GPT-5 architecture, autonomous agents, and a comparative analysis with leading open-source models.",
    takeaways: [
      "GPT-5 introduces stronger tool routing and memory handling.",
      "Agentic workflows are moving from demos to production guardrails.",
      "Open-source models close latency/cost gaps on constrained tasks.",
    ],
  },
  {
    id: "v2",
    title: "Market Edge",
    signal: 84,
    tags: ["#Finance", "#Crypto"],
    summary:
      "Analyzes the Federal Reserve recent interest rate decision and its impact on cryptocurrency volatility.",
    takeaways: [
      "Rate decision increased short-term risk appetite.",
      "BTC volatility rises during macro-news windows.",
      "Hedging narratives dominate institutional commentary.",
    ],
  },
  {
    id: "v3",
    title: "Daily Zen",
    signal: 78,
    tags: ["#Lifestyle", "#Bien-être"],
    summary:
      "Explores mindfulness techniques for remote workers, including digital detox strategies and setting healthy boundaries.",
    takeaways: [
      "Short deep-work blocks outperform long distracted sessions.",
      "Calendar hygiene is a major stress reducer.",
      "Small offline rituals improve focus recovery.",
    ],
  },
] as const;

export const TASKS: TaskItem[] = [
  {
    id: "t1",
    label: "Review Contract (from Joey)",
    ref: "Email Thread #1",
    details:
      "Contract Q4 includes revised payment terms and SLA penalties. Validation required before 14:00.",
  },
  {
    id: "t2",
    label: "Follow up with Client X",
    ref: "Email Thread #2",
    details:
      "Client asks for migration timeline and security hardening milestones for September.",
  },
  {
    id: "t3",
    label: "Prepare Presentation",
    ref: "Calendar Sync",
    details:
      "Finalize product narrative and benchmark slides for architecture review.",
  },
  {
    id: "t4",
    label: "Review proposal by EOD",
    ref: "Issue Inbox",
    details:
      "Proposal impacts infra costs and requires product + engineering sign-off.",
  },
] as const;

export const ALERTS: AlertItem[] = [
  {
    id: "a1",
    title: "Hameçonnage Intercepté (Phishing 99.4%)",
    time: "08:11 AM",
    description:
      "Tentative d’usurpation d’identité bancaire bloquée par le Bouclier PHAROS.",
    cta: "Inspecter la menace",
    accent: "#F87171",
    bg: "bg-[#200F0F]",
    border: "border-[#3D1515]",
  },
  {
    id: "a2",
    title: "Service Agreement en attente de signature",
    time: "Dû 08:15 AM",
    description:
      "Contrat Q4 envoyé par Sarah Jenkins. (Délai 30). Démarrage 1er nov.",
    cta: "Voir le contrat",
    accent: "#C49B66",
    bg: "bg-[#1D1611]",
    border: "border-[#3A2E1A]",
  },
  {
    id: "a3",
    title: "Quota AI Gemini 1.5 Pro Nominal",
    time: "08:08 AM",
    description: "4 600 tokens utilisés aujourd’hui sur 100 000 max.",
    cta: "Consulter la console",
    accent: "#4ADE80",
    bg: "bg-[#0D1A11]",
    border: "border-[#1A3325]",
  },
] as const;

