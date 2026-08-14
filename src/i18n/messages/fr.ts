const fr = {
  nav: {
    dashboard: "Tableau de bord",
    mail: "Mail",
    compose: "Composer",
    contacts: "Contacts",
    calendar: "Calendrier",
    newsletters: "Newsletters",
    translation: "Traduction",
    docs: "Docs",
    documentation: "Documentation",
    monitoring: "Monitoring",
    security: "Sécurité",
    admin: "Admin",
    settings: "Paramètres",
    language: "Langue",
  },
  dashboard: {
    badge: "Morning Journalist Dashboard",
    title: "Bonjour. Voici l’état de votre monde ce matin.",
    subtitle:
      "Vue novamail: inbox prioritaire, veille signal, agenda intelligent et sécurité opérationnelle.",
    metrics: {
      unread: "Mails non lus",
      highSignal: "Veille >80%",
      actions: "Actions",
      alerts: "Alertes",
      storage: "Stockage",
      receivedTonight: "reçus cette nuit",
      newslettersHighSignal: "newsletters à fort signal",
      urgentCount: "dont 3 urgentes",
      criticalOne: "1 critique",
      afterCleanup: "après purge",
    },
    blocks: {
      dayMails: "Mails du jour",
      watch: "Veille & Presse",
      agenda: "Agenda & TODO",
      ops: "Sécurité & Ops",
      processInbox: "Traiter dans l’inbox",
      openHub: "Ouvrir le Hub",
      openCalendar: "Voir Smart Calendar",
      inspect: "Inspecter",
    },
  },
  mailShell: {
    searchPlaceholder: "Rechercher (from:, subject:, has:attachment...)",
    proMode: "Mode Pro",
  },
} as const;

export default fr;
