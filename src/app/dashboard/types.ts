export interface DashboardHighlight {
  color: string;
  category: string;
  text: string;
}

export interface DashboardNewsletterItem {
  id: string;
  title: string;
  signal: number;
  tags: string[];
  summary: string;
  topic?: string;
  updatedAt?: string;
  createdAt?: string;
  links?: Array<{ name: string; url: string }>;
  takeaways?: string[];
}

export interface DashboardDailyMailPriorityItem {
  emailId: string;
  subject: string;
  from: string;
  reason: string;
  priorityScore: number;
}

export interface DashboardDailyMailActionItem {
  text: string;
  emailId?: string;
}

export interface DashboardDailyMailSummary {
  mailboxActivity: string[];
  pendingActions: DashboardDailyMailActionItem[];
  exchangedInfo: string[];
  priorityEmails: DashboardDailyMailPriorityItem[];
  generatedAt: string;
  source: "ai" | "rules";
}

export interface DashboardTaskItem {
  id: string;
  label: string;
  ref?: string;
  details?: string;
  due?: string;
  priority?: "high" | "medium" | "low";
}

export interface DashboardAlertItem {
  id: string;
  title: string;
  description: string;
  time: string;
  cta: string;
  bg?: string;
  border?: string;
  accent?: string;
  severity?: "critical" | "high" | "medium" | "low" | "info";
}
