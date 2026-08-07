const en = {
  nav: {
    dashboard: "Dashboard",
    mail: "Mail",
    compose: "Compose",
    contacts: "Contacts",
    calendar: "Calendar",
    newsletters: "Newsletters",
    translation: "Translation",
    docs: "Docs",
    monitoring: "Monitoring",
    security: "Security",
    admin: "Admin",
    settings: "Settings",
    language: "Language",
  },
  dashboard: {
    badge: "Morning Journalist Dashboard",
    title: "Good morning. Here is your world status for today.",
    subtitle:
      "Novamail-style overview: priority inbox, high-signal watch, smart schedule and operational security.",
    metrics: {
      unread: "Unread emails",
      highSignal: "Watch >80%",
      actions: "Actions",
      alerts: "Alerts",
      storage: "Storage",
      receivedTonight: "received overnight",
      newslettersHighSignal: "high-signal newsletters",
      urgentCount: "including 3 urgent",
      criticalOne: "1 critical",
      afterCleanup: "after cleanup",
    },
    blocks: {
      dayMails: "Today emails",
      watch: "Watch & Press",
      agenda: "Agenda & TODO",
      ops: "Security & Ops",
      processInbox: "Process in inbox",
      openHub: "Open Hub",
      openCalendar: "Open Smart Calendar",
      inspect: "Inspect",
    },
  },
  mailShell: {
    searchPlaceholder: "Search (from:, subject:, has:attachment...)",
    proMode: "Pro mode",
  },
} as const;

export default en;
