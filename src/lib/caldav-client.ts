/**
 * CalDAV client utility (Issue #503).
 *
 * Provides CalDAV integration for calendar events across multiple providers
 * (Nextcloud, Fastmail, iCloud, Yahoo). Supports reading, creating, updating,
 * and deleting calendar events via the CalDAV protocol (RFC 4791).
 */

export interface CalDAVAccount {
  id: string;
  name: string;
  url: string;
  username: string;
  password: string;
  provider: "nextcloud" | "fastmail" | "icloud" | "yahoo" | "custom";
}

export interface CalDAVEvent {
  id: string;
  uid: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  etag?: string;
  url?: string;
}

export interface CalDAVCalendar {
  id: string;
  name: string;
  url: string;
  color?: string;
  isReadOnly: boolean;
}

export interface CalDAVQueryResult {
  events: CalDAVEvent[];
  total: number;
}

export const CALDAV_PROVIDERS: Record<string, {
  name: string;
  baseUrl: string;
  supportsMultiCalendar: boolean;
}> = {
  nextcloud: {
    name: "Nextcloud",
    baseUrl: "/remote.php/dav",
    supportsMultiCalendar: true,
  },
  fastmail: {
    name: "Fastmail",
    baseUrl: "/dav",
    supportsMultiCalendar: true,
  },
  icloud: {
    name: "iCloud",
    baseUrl: "/dav",
    supportsMultiCalendar: false,
  },
  yahoo: {
    name: "Yahoo",
    baseUrl: "/dav",
    supportsMultiCalendar: false,
  },
  custom: {
    name: "Custom",
    baseUrl: "",
    supportsMultiCalendar: true,
  },
};

/**
 * Build CalDAV URL for a provider.
 */
export function buildCalDAVUrl(account: CalDAVAccount): string {
  const provider = CALDAV_PROVIDERS[account.provider];
  if (!provider) return account.url;

  return `${account.url.replace(/\/$/, "")}${provider.baseUrl}`;
}

/**
 * Create a CalDAV account configuration.
 */
export function createCalDAVAccount(options: {
  name: string;
  url: string;
  username: string;
  password: string;
  provider: CalDAVAccount["provider"];
}): CalDAVAccount {
  return {
    id: `cal-${Date.now()}`,
    ...options,
  };
}

/**
 * Validate a CalDAV account configuration.
 */
export function validateCalDAVAccount(account: CalDAVAccount): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!account.url.trim()) {
    errors.push("URL is required");
  }

  if (!account.username.trim()) {
    errors.push("Username is required");
  }

  if (!account.password.trim()) {
    errors.push("Password is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a unique ID for a calendar event.
 */
export function generateEventUID(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}@misfits.ai`;
}

/**
 * Format a date for CalDAV (UTC ISO format).
 */
export function formatCalDAVDate(date: string): string {
  const d = new Date(date);
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "Z");
}

/**
 * Parse a CalDAV date string.
 */
export function parseCalDAVDate(dateStr: string): string {
  // Handle basic ISO format
  if (dateStr.includes("T")) {
    return new Date(dateStr).toISOString();
  }

  // Handle CalDAV format: 20260910T120000Z
  if (dateStr.length === 15 || dateStr.length === 16) {
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    const hour = dateStr.slice(9, 11);
    const minute = dateStr.slice(11, 13);
    const second = dateStr.slice(13, 15);
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`).toISOString();
  }

  return new Date().toISOString();
}

/**
 * Build a CalDAV REPORT request body for querying events.
 */
export function buildEventQuery(startDate: string, endDate: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:getetag/>
    <c:calendar-data/>
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VEVENT">
        <c:time-range start="${formatCalDAVDate(startDate)}" end="${formatCalDAVDate(endDate)}"/>
      </c:comp-filter>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`;
}

/**
 * Build a CalDAV PUT request body for creating/updating an event.
 */
export function buildEventPUT(event: CalDAVEvent): string {
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//misfits.ai//Mail//EN
BEGIN:VEVENT
UID:${event.uid}
SUMMARY:${event.summary}
DTSTART:${formatCalDAVDate(event.start)}
DTEND:${formatCalDAVDate(event.end)}
${event.description ? `DESCRIPTION:${event.description}` : ""}
${event.location ? `LOCATION:${event.location}` : ""}
END:VEVENT
END:VCALENDAR`;
}

/**
 * Parse a CalDAV response into calendar events.
 */
export function parseCalDAVResponse(xml: string): CalDAVEvent[] {
  const events: CalDAVEvent[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");

  const responses = doc.querySelectorAll("response");
  for (const response of responses) {
    const href = response.querySelector("href")?.textContent || "";
    const etag = response.querySelector("getetag")?.textContent || "";
    const calendarData = response.querySelector("calendar-data")?.textContent || "";

    if (!calendarData) continue;

    const event = parseICalEvent(calendarData);
    if (event) {
      event.url = href;
      event.etag = etag;
      events.push(event);
    }
  }

  return events;
}

/**
 * Parse a single iCalendar VEVENT block.
 */
function parseICalEvent(icalData: string): CalDAVEvent | null {
  const lines = icalData.split(/\r?\n/);
  let summary = "";
  let uid = "";
  let start = "";
  let end = "";
  let description = "";
  let location = "";
  let inEvent = false;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      continue;
    }
    if (line === "END:VEVENT") {
      break;
    }
    if (!inEvent) continue;

    if (line.startsWith("SUMMARY:")) {
      summary = line.slice(8);
    } else if (line.startsWith("UID:")) {
      uid = line.slice(4);
    } else if (line.startsWith("DTSTART:")) {
      start = parseCalDAVDate(line.slice(8));
    } else if (line.startsWith("DTEND:")) {
      end = parseCalDAVDate(line.slice(6));
    } else if (line.startsWith("DESCRIPTION:")) {
      description = line.slice(12);
    } else if (line.startsWith("LOCATION:")) {
      location = line.slice(9);
    }
  }

  if (!uid) return null;

  return {
    id: uid,
    uid,
    summary,
    start: start || new Date().toISOString(),
    end: end || new Date().toISOString(),
    description: description || undefined,
    location: location || undefined,
  };
}

/**
 * Create a new calendar event.
 */
export function createCalDAVEvent(options: {
  summary: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
}): CalDAVEvent {
  return {
    id: generateEventUID(),
    uid: generateEventUID(),
    summary: options.summary,
    start: options.start,
    end: options.end,
    description: options.description,
    location: options.location,
  };
}

/**
 * Check if a provider supports multi-calendar.
 */
export function supportsMultiCalendar(provider: CalDAVAccount["provider"]): boolean {
  return CALDAV_PROVIDERS[provider]?.supportsMultiCalendar ?? false;
}

/**
 * Get provider display name.
 */
export function getProviderName(provider: CalDAVAccount["provider"]): string {
  return CALDAV_PROVIDERS[provider]?.name || provider;
}
