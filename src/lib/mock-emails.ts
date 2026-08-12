/**
 * Mock email data for development — realistic emails across folders,
 * senders, dates, flags, and attachments. 55 entries total.
 */
import type {
  Email,
  EmailFolder,
  EmailLabel,
  EmailAttachment,
} from "@/types/email";

export const mockFolders: EmailFolder[] = [
  { id: "inbox", name: "Inbox", icon: "Inbox", unreadCount: 8, totalCount: 42 },
  { id: "sent", name: "Sent", icon: "Send", unreadCount: 0, totalCount: 18 },
  {
    id: "drafts",
    name: "Drafts",
    icon: "FileText",
    unreadCount: 0,
    totalCount: 3,
  },
  {
    id: "archive",
    name: "Archive",
    icon: "Archive",
    unreadCount: 0,
    totalCount: 127,
  },
  {
    id: "trash",
    name: "Trash",
    icon: "Trash2",
    unreadCount: 0,
    totalCount: 12,
  },
  {
    id: "spam",
    name: "Spam",
    icon: "AlertCircle",
    unreadCount: 2,
    totalCount: 5,
  },
];

export const mockLabels: EmailLabel[] = [
  { id: "label-work", name: "Work", color: "#3b5bff" },
  { id: "label-personal", name: "Personal", color: "#10b981" },
  { id: "label-finance", name: "Finance", color: "#f59e0b" },
  { id: "label-travel", name: "Travel", color: "#0ea5e9" },
  { id: "label-newsletter", name: "Newsletter", color: "#a1a1aa" },
  { id: "label-urgent", name: "Urgent", color: "#ef4444" },
];

function daysAgo(days: number, hours = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

function makeAttachment(
  filename: string,
  contentType: string,
  size: number,
  type: EmailAttachment["type"]
): EmailAttachment {
  return { id: crypto.randomUUID(), filename, contentType, size, type };
}

type EmailSeed = {
  from: { name: string; address: string };
  subject: string;
  preview: string;
  body: string;
  folder: Email["folder"];
  daysAgo: number;
  hoursAgo?: number;
  isRead?: boolean;
  isStarred?: boolean;
  isImportant?: boolean;
  labels?: string[];
  attachments?: EmailAttachment[];
  bodyType?: Email["bodyType"];
};

const seeds: EmailSeed[] = [
  {
    from: { name: "Sarah Chen", address: "sarah.chen@misfits.ai" },
    subject: "Q3 Product Roadmap — Final Review",
    preview:
      "Hi team, I've attached the finalized Q3 roadmap with the updated timeline for the AI assistant launch. Please review before Thursday's sync...",
    body: `<p>Hi team,</p><p>I've attached the finalized Q3 roadmap with the updated timeline for the <strong>AI assistant launch</strong>. Please review before Thursday's sync and add any concerns to the doc.</p><p>Key milestones:</p><ul><li>July 30 — Feature freeze</li><li>Aug 15 — Internal beta</li><li>Sept 1 — Public beta</li></ul><p>Thanks,<br>Sarah</p>`,
    folder: "inbox",
    daysAgo: 0,
    hoursAgo: 2,
    isRead: false,
    isStarred: true,
    isImportant: true,
    labels: ["label-work", "label-urgent"],
    attachments: [
      makeAttachment("Q3-Roadmap.pdf", "application/pdf", 240000, "pdf"),
      makeAttachment(
        "timeline.xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        56000,
        "spreadsheet"
      ),
    ],
    bodyType: "html",
  },
  {
    from: { name: "GitHub", address: "noreply@github.com" },
    subject: "[misfits-web] PR #138 merged into master",
    preview:
      "Your pull request 'feat(#137): keyboard shortcuts infrastructure' has been merged. View the changes at the link below.",
    body: `<p>Your pull request <strong>'feat(#137): keyboard shortcuts infrastructure'</strong> has been merged into <code>master</code>.</p><p>View the changes <a href="#">here</a>.</p>`,
    folder: "inbox",
    daysAgo: 0,
    hoursAgo: 5,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  {
    from: { name: "Marcus Rodriguez", address: "marcus@misfits.ai" },
    subject: "Re: Architecture decision — Redis vs. Valkey for caching",
    preview:
      "After the team discussion, I think Valkey is the right call. It's a drop-in Redis replacement with an active community...",
    body: `<p>Hey,</p><p>After the team discussion, I think <strong>Valkey</strong> is the right call. It's a drop-in Redis replacement with an active community and no licensing concerns.</p><blockquote>I'd love to hear your thoughts on cluster mode vs. standalone.</blockquote><p>We should also benchmark against Memurai on Windows.</p><p>— Marcus</p>`,
    folder: "inbox",
    daysAgo: 0,
    hoursAgo: 8,
    isRead: false,
    isStarred: false,
    labels: ["label-work"],
    bodyType: "html",
  },
  {
    from: { name: "Stripe", address: "receipts@stripe.com" },
    subject: "Your invoice #INV-2026-0042 is ready",
    preview:
      "Invoice for $1,299.00 covering the Pro plan (5 seats) for August 2026. Your card ending in 4242 was charged successfully.",
    body: `<p>Hi,</p><p>Invoice <strong>#INV-2026-0042</strong> for <strong>$1,299.00</strong> covering the Pro plan (5 seats) for August 2026.</p><p>Your card ending in <strong>4242</strong> was charged successfully.</p><p>Download your invoice <a href="#">here</a>.</p>`,
    folder: "inbox",
    daysAgo: 0,
    hoursAgo: 14,
    isRead: true,
    labels: ["label-finance"],
    attachments: [
      makeAttachment("INV-2026-0042.pdf", "application/pdf", 88000, "pdf"),
    ],
    bodyType: "html",
  },
  {
    from: {
      name: "The Pragmatic Engineer",
      address: "newsletter@substack.com",
    },
    subject: "Issue #217: Building reliable background job systems",
    preview:
      "This week: a deep dive into how Shopify, GitLab, and Stripe architect their background job processing at scale, with lessons...",
    body: `<p>This week: a deep dive into how Shopify, GitLab, and Stripe architect their <strong>background job processing</strong> at scale.</p><h2>In this issue</h2><ul><li>Sidekiq internals</li><li>Job idempotency patterns</li><li>Dead letter queues</li></ul><p>Read the full issue <a href="#">here</a>.</p>`,
    folder: "inbox",
    daysAgo: 1,
    isRead: false,
    labels: ["label-newsletter"],
    bodyType: "html",
  },
  {
    from: { name: "Emily Watson", address: "emily.watson@gmail.com" },
    subject: "Weekend trip to Lisbon — flight options",
    preview:
      "Hey! I found some great flight deals for the Lisbon trip in September. Round trip from SFO is around $680 if we book before Friday...",
    body: `Hey!\n\nI found some great flight deals for the Lisbon trip in September. Round trip from SFO is around $680 if we book before Friday.\n\nOptions:\n1. TAP Air Portugal — direct, $720\n2. Iberia — 1 stop in Madrid, $680\n3. Lufthansa — 1 stop in Frankfurt, $710\n\nLet me know which you prefer!\n\nEm`,
    folder: "inbox",
    daysAgo: 1,
    hoursAgo: 3,
    isRead: false,
    isStarred: true,
    labels: ["label-personal", "label-travel"],
    bodyType: "text",
  },
  {
    from: { name: "Vercel", address: "notifications@vercel.com" },
    subject: "Deployment succeeded for misfits-web",
    preview:
      "Your deployment to production was successful. Build completed in 42s. View deployment at https://misfits-web.vercel.app",
    body: `<p>Your deployment to <strong>production</strong> was successful.</p><ul><li>Build completed in <strong>42s</strong></li><li>0 errors, 0 warnings</li><li>URL: <a href="#">https://misfits-web.vercel.app</a></li></ul>`,
    folder: "inbox",
    daysAgo: 1,
    hoursAgo: 6,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  {
    from: { name: "David Kim", address: "david.kim@misfits.ai" },
    subject: "New design system components ready for review",
    preview:
      "I've finished the latest batch of components including a polished command palette, context menu, and toast variants. Figma file is updated...",
    body: `<p>Hi all,</p><p>I've finished the latest batch of components including a polished <strong>command palette</strong>, <strong>context menu</strong>, and <strong>toast variants</strong>.</p><p>Figma file is updated. Can someone review the PR before EOD?</p><p>Thanks,<br>David</p>`,
    folder: "inbox",
    daysAgo: 1,
    hoursAgo: 10,
    isRead: false,
    labels: ["label-work"],
    attachments: [
      makeAttachment(
        "design-system-v2.fig",
        "application/octet-stream",
        4500000,
        "other"
      ),
    ],
    bodyType: "html",
  },
  {
    from: { name: "AWS Billing", address: "billing@aws.amazon.com" },
    subject: "Your AWS bill for July 2026 is available",
    preview:
      "Your AWS account #8472-3910-5523 has a new bill of $2,847.23 for July 2026. Payment will be charged to your card on Aug 15.",
    body: `<p>Your AWS account <strong>#8472-3910-5523</strong> has a new bill of <strong>$2,847.23</strong> for July 2026.</p><p>Payment will be charged to your card on Aug 15.</p><p>View detailed billing <a href="#">here</a>.</p>`,
    folder: "inbox",
    daysAgo: 2,
    isRead: true,
    labels: ["label-finance"],
    attachments: [
      makeAttachment("aws-bill-jul-2026.pdf", "application/pdf", 120000, "pdf"),
    ],
    bodyType: "html",
  },
  {
    from: { name: "Linear", address: "notifications@linear.app" },
    subject: "3 issues assigned to you this week",
    preview:
      "You have 3 new issues assigned: MAI-142 (Inbox view), MAI-143 (Compose window), MAI-144 (Settings page). Sprint ends Friday.",
    body: `<p>You have <strong>3 new issues</strong> assigned:</p><ul><li><strong>MAI-142</strong> — Inbox view</li><li><strong>MAI-143</strong> — Compose window</li><li><strong>MAI-144</strong> — Settings page</li></ul><p>Sprint ends Friday.</p>`,
    folder: "inbox",
    daysAgo: 2,
    isRead: false,
    labels: ["label-work"],
    bodyType: "html",
  },
  {
    from: { name: "Mom", address: "patricia.watson@comcast.net" },
    subject: "Did you see the photos from the reunion?",
    preview:
      "Your uncle finally sent over the photos from the family reunion! There's one of you and grandma that turned out great...",
    body: `Hi sweetie,\n\nYour uncle finally sent over the photos from the family reunion! There's one of you and grandma that turned out great. I printed a copy for your room.\n\nCall me when you get a chance!\n\nLove,\nMom`,
    folder: "inbox",
    daysAgo: 2,
    hoursAgo: 5,
    isRead: true,
    isStarred: true,
    labels: ["label-personal"],
    attachments: [
      makeAttachment("reunion-001.jpg", "image/jpeg", 3400000, "image"),
      makeAttachment("reunion-002.jpg", "image/jpeg", 2800000, "image"),
      makeAttachment("reunion-003.jpg", "image/jpeg", 3100000, "image"),
    ],
    bodyType: "text",
  },
  {
    from: {
      name: "Stack Overflow",
      address: "do-not-reply@stackoverflow.email",
    },
    subject: "New answers to your TypeScript question",
    preview:
      "2 new answers were posted to your question 'How to properly type a generic Zustand store with discriminated unions?'",
    body: `<p>2 new answers were posted to your question <a href="#">'How to properly type a generic Zustand store with discriminated unions?'</a></p>`,
    folder: "inbox",
    daysAgo: 3,
    isRead: true,
    labels: ["label-newsletter"],
    bodyType: "html",
  },
  {
    from: { name: "Alex Thompson", address: "alex@misfits.ai" },
    subject: "Postmortem: July 14 API outage",
    preview:
      "As discussed in the retro, here's the detailed postmortem for the 47-minute outage. Root cause was a connection pool exhaustion...",
    body: `<h1>Postmortem: July 14 API Outage</h1><h2>Summary</h2><p>On July 14, 2026, the misfits.ai API was unavailable for <strong>47 minutes</strong> due to connection pool exhaustion in the mail service.</p><h2>Root Cause</h2><p>A misconfigured connection pool limit (set to 10 instead of 100) caused new connections to time out under load.</p><h2>Action Items</h2><ul><li>Fix pool config (done)</li><li>Add autoscaling alerts (in progress)</li><li>Load test before releases (planned)</li></ul>`,
    folder: "inbox",
    daysAgo: 3,
    isRead: false,
    isImportant: true,
    labels: ["label-work", "label-urgent"],
    attachments: [
      makeAttachment("postmortem-jul14.pdf", "application/pdf", 95000, "pdf"),
    ],
    bodyType: "html",
  },
  {
    from: { name: "Figma", address: "no-reply@figma.com" },
    subject: "David Kim commented on 'Mail Inbox Design v3'",
    preview:
      "David left a comment: 'Can we explore a darker variant for the sidebar? The current one feels too heavy next to the email list...'",
    body: `<p><strong>David Kim</strong> left a comment:</p><blockquote>Can we explore a darker variant for the sidebar? The current one feels too heavy next to the email list.</blockquote>`,
    folder: "inbox",
    daysAgo: 3,
    hoursAgo: 4,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  {
    from: { name: "Notion", address: "team@makenotion.com" },
    subject: "Weekly digest: 4 pages updated in your workspace",
    preview:
      "This week in your 'Misfits Mail' workspace: Roadmap updated, API docs revised, Sprint planning added, Architecture notes...",
    body: `<p>This week in your <strong>'Misfits Mail'</strong> workspace:</p><ul><li>Roadmap updated</li><li>API docs revised</li><li>Sprint planning added</li><li>Architecture notes</li></ul>`,
    folder: "inbox",
    daysAgo: 4,
    isRead: true,
    labels: ["label-newsletter"],
    bodyType: "html",
  },
  {
    from: { name: "Jenny Liu", address: "jenny.liu@misfits.ai" },
    subject: "Onboarding feedback from new hires",
    preview:
      "I've compiled the feedback from the 5 new hires who joined this month. Overall positive, but a few recurring suggestions...",
    body: `<p>Hi,</p><p>I've compiled the feedback from the <strong>5 new hires</strong> who joined this month.</p><p>Overall positive, but a few recurring suggestions:</p><ol><li>More documentation on the CI pipeline</li><li>Earlier access to staging environment</li><li>Better onboarding for the Rust codebase</li></ol><p>Full report attached.</p>`,
    folder: "inbox",
    daysAgo: 4,
    isRead: false,
    labels: ["label-work"],
    attachments: [
      makeAttachment(
        "onboarding-feedback.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        72000,
        "doc"
      ),
    ],
    bodyType: "html",
  },
  {
    from: { name: "Docker Hub", address: "notifications@hub.docker.com" },
    subject: "Docker image build failed for misfits-web:latest",
    preview:
      "The automated build for misfits-web:latest failed. Error: Step 8/12: RUN pnpm build — exited with code 1...",
    body: `<p>The automated build for <strong>misfits-web:latest</strong> failed.</p><pre>Error: Step 8/12: RUN pnpm build — exited with code 1</pre><p>View logs <a href="#">here</a>.</p>`,
    folder: "inbox",
    daysAgo: 5,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  {
    from: { name: "Booking.com", address: "no-reply@booking.com" },
    subject: "Your reservation in Lisbon — Sep 12-18",
    preview:
      "Booking confirmed: Hotel Avenida Palace, Superior King Room, 6 nights, $1,140 total. Free cancellation until Sep 10.",
    body: `<p>Booking confirmed!</p><table><tr><td>Hotel</td><td>Hotel Avenida Palace</td></tr><tr><td>Room</td><td>Superior King Room</td></tr><tr><td>Dates</td><td>Sep 12–18 (6 nights)</td></tr><tr><td>Total</td><td>$1,140</td></tr></table><p>Free cancellation until Sep 10.</p>`,
    folder: "inbox",
    daysAgo: 5,
    isRead: false,
    isStarred: true,
    labels: ["label-travel", "label-personal"],
    bodyType: "html",
  },
  {
    from: { name: "Hacker News Daily", address: "digest@hndaily.com" },
    subject: "Top stories — AI, Rust, and the future of email",
    preview:
      "Today's top stories: 'Why we rewrote our backend in Rust', 'The case against SPAs', 'How Gmail processes 300B emails/day'...",
    body: `<p>Today's top stories:</p><ul><li><a href="#">Why we rewrote our backend in Rust</a></li><li><a href="#">The case against SPAs</a></li><li><a href="#">How Gmail processes 300B emails/day</a></li><li><a href="#">Building accessible dropdown menus</a></li></ul>`,
    folder: "inbox",
    daysAgo: 6,
    isRead: true,
    labels: ["label-newsletter"],
    bodyType: "html",
  },
  {
    from: { name: "HR Department", address: "hr@misfits.ai" },
    subject: "Open enrollment: benefits selection due Aug 15",
    preview:
      "It's time to select your benefits for 2026-2027. Please log in to the benefits portal and make your selections by August 15...",
    body: `<p>Hi,</p><p>It's time to select your benefits for 2026-2027.</p><p>Please log in to the <a href="#">benefits portal</a> and make your selections by <strong>August 15</strong>.</p><p>Questions? Email <a href="#">hr@misfits.ai</a>.</p>`,
    folder: "inbox",
    daysAgo: 7,
    isRead: false,
    isImportant: true,
    labels: ["label-work", "label-urgent"],
    bodyType: "html",
  },
  {
    from: { name: "Ryan Park", address: "ryan@misfits.ai" },
    subject: "Re: Re: Re: Lunch this week?",
    preview:
      "Wednesday works! Let's do the ramen place on 5th. 12:30? I'll book a table.",
    body: `<p>Wednesday works! Let's do the ramen place on 5th. 12:30? I'll book a table.</p><p>Ryan</p>`,
    folder: "inbox",
    daysAgo: 7,
    hoursAgo: 2,
    isRead: true,
    labels: ["label-personal"],
    bodyType: "html",
  },
  {
    from: { name: "Sentry", address: "alerts@sentry.io" },
    subject: "[misfits-web] 12 new errors in production",
    preview:
      "12 new errors detected in the last hour. TypeError: Cannot read properties of undefined (reading 'map') in EmailList...",
    body: `<p><strong>12 new errors</strong> detected in the last hour.</p><pre>TypeError: Cannot read properties of undefined (reading 'map')\n  at EmailList (email-list.tsx:42:18)</pre><p>View in Sentry <a href="#">here</a>.</p>`,
    folder: "inbox",
    daysAgo: 8,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  {
    from: { name: "LinkedIn", address: "messages-noreply@linkedin.com" },
    subject: "You have 3 new connection requests",
    preview:
      "3 people want to connect: a Senior Engineer at Vercel, a Staff Designer at Linear, and a CTO at a YC startup...",
    body: `<p>3 people want to connect:</p><ul><li>Senior Engineer at Vercel</li><li>Staff Designer at Linear</li><li>CTO at a YC startup</li></ul>`,
    folder: "inbox",
    daysAgo: 9,
    isRead: true,
    labels: ["label-newsletter"],
    bodyType: "html",
  },
  {
    from: { name: "Tom Anderson", address: "tom@misfits.ai" },
    subject: "Security audit — preliminary findings",
    preview:
      "I've completed the first pass of the security audit. Two high-severity findings related to session management and one medium...",
    body: `<p>Hi,</p><p>I've completed the first pass of the security audit. Two <strong>high-severity</strong> findings related to session management and one <strong>medium</strong> for CSP headers.</p><p>Full report attached. Let's schedule a review meeting.</p>`,
    folder: "inbox",
    daysAgo: 10,
    isRead: false,
    isImportant: true,
    labels: ["label-work", "label-urgent"],
    attachments: [
      makeAttachment("security-audit-v1.pdf", "application/pdf", 210000, "pdf"),
    ],
    bodyType: "html",
  },
  {
    from: { name: "Spotify", address: "no-reply@spotify.com" },
    subject: "Your Discover Weekly is ready",
    preview:
      "30 new tracks based on your listening history this week. Featuring artists similar to Bonobo, Tycho, and ODESZA.",
    body: `<p>30 new tracks based on your listening history this week.</p><p>Featuring artists similar to <strong>Bonobo</strong>, <strong>Tycho</strong>, and <strong>ODESZA</strong>.</p>`,
    folder: "inbox",
    daysAgo: 11,
    isRead: true,
    labels: [],
    bodyType: "html",
  },
  {
    from: { name: "James Cooper", address: "james@misfits.ai" },
    subject: "API rate limiting — proposed approach",
    preview:
      "I've drafted a proposal for the new rate limiting strategy. We're looking at a token bucket algorithm per-user with...",
    body: `<p>Hi team,</p><p>I've drafted a proposal for the new rate limiting strategy. We're looking at a <strong>token bucket</strong> algorithm per-user with:</p><ul><li>100 requests/min for free tier</li><li>1000 requests/min for Pro</li><li>10000 requests/min for Enterprise</li></ul><p>Thoughts?</p>`,
    folder: "inbox",
    daysAgo: 12,
    isRead: false,
    labels: ["label-work"],
    bodyType: "html",
  },
  {
    from: { name: "Apple Developer", address: "developer@apple.com" },
    subject: "Your app 'Misfits Mail' has been approved",
    preview:
      "Your app submission has been approved and is now available on the App Store. Version 1.0.0, build 142.",
    body: `<p>Your app <strong>'Misfits Mail'</strong> has been approved and is now available on the App Store.</p><p>Version 1.0.0, build 142.</p>`,
    folder: "inbox",
    daysAgo: 14,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  {
    from: { name: "Grandma", address: "rose.watson@hotmail.com" },
    subject: "Birthday card for you!",
    preview:
      "Dear sweetie, I hope you have a wonderful birthday! I baked your favorite — the lemon cake. Come visit soon!",
    body: `Dear sweetie,\n\nI hope you have a wonderful birthday! I baked your favorite — the lemon cake. Come visit soon!\n\nAll my love,\nGrandma`,
    folder: "inbox",
    daysAgo: 14,
    hoursAgo: 5,
    isRead: true,
    isStarred: true,
    labels: ["label-personal"],
    bodyType: "text",
  },
  {
    from: { name: "CPA Tax Services", address: "office@cpatax.com" },
    subject: "Tax documents ready for your review",
    preview:
      "Your 2026 tax documents are ready. Please review the attached and let us know if you have questions before filing...",
    body: `<p>Hi,</p><p>Your 2026 tax documents are ready. Please review the attached and let us know if you have questions before filing.</p><p>Deadline: April 15, 2027.</p>`,
    folder: "inbox",
    daysAgo: 15,
    isRead: true,
    labels: ["label-finance"],
    attachments: [
      makeAttachment("tax-2026-summary.pdf", "application/pdf", 180000, "pdf"),
      makeAttachment(
        "tax-2026-forms.zip",
        "application/zip",
        320000,
        "archive"
      ),
    ],
    bodyType: "html",
  },
  {
    from: { name: "Victoria Schmidt", address: "victoria@misfits.ai" },
    subject: "Q2 retrospective notes — action items",
    preview:
      "Here are the notes from the Q2 retro. We agreed on 6 action items across the team. I've highlighted owners and deadlines...",
    body: `<p>Here are the notes from the Q2 retro. We agreed on 6 action items across the team.</p><p>I've highlighted owners and deadlines in the doc. Please review and add to the tracker.</p>`,
    folder: "inbox",
    daysAgo: 16,
    isRead: false,
    labels: ["label-work"],
    bodyType: "html",
  },
  {
    from: { name: "Slack", address: "no-reply@slack.com" },
    subject: "You have 4 unread mentions in #misfits-mail",
    preview:
      "You were mentioned in #misfits-mail by Sarah, Marcus, and 2 others. Click to view in Slack.",
    body: `<p>You were mentioned in <strong>#misfits-mail</strong> by Sarah, Marcus, and 2 others.</p>`,
    folder: "inbox",
    daysAgo: 17,
    isRead: true,
    labels: ["label-newsletter"],
    bodyType: "html",
  },
  {
    from: { name: "Dr. Patel's Office", address: "appointments@drpatel.com" },
    subject: "Appointment reminder: Aug 5 at 10:00 AM",
    preview:
      "This is a reminder for your annual checkup on August 5, 2026 at 10:00 AM. Please arrive 15 minutes early.",
    body: `This is a reminder for your annual checkup on August 5, 2026 at 10:00 AM.\n\nPlease arrive 15 minutes early.\n\nIf you need to reschedule, call (555) 123-4567.`,
    folder: "inbox",
    daysAgo: 18,
    isRead: true,
    labels: ["label-personal"],
    bodyType: "text",
  },
  {
    from: { name: "Camping World", address: "deals@campingworld.com" },
    subject: "🔥 50% OFF all tents this weekend only!",
    preview:
      "Don't miss our biggest tent sale of the year! 50% off all 4-season and 3-season tents. Plus free shipping...",
    body: `<p>Don't miss our biggest tent sale of the year! <strong>50% off</strong> all 4-season and 3-season tents.</p><p>Plus free shipping on orders over $99.</p>`,
    folder: "spam",
    daysAgo: 2,
    isRead: false,
    bodyType: "html",
  },
  {
    from: { name: "Crypto Daily", address: "win@crypto-daily.biz" },
    subject: "You've been selected for a $5000 Bitcoin giveaway!",
    preview:
      "Congratulations! You are one of 100 winners selected for our exclusive Bitcoin giveaway. Claim your $5000 in BTC now...",
    body: `<p>Congratulations! You are one of 100 winners selected for our exclusive Bitcoin giveaway.</p><p>Claim your $5000 in BTC <a href="#">now</a>!</p>`,
    folder: "spam",
    daysAgo: 5,
    isRead: false,
    bodyType: "html",
  },
  // Sent items
  {
    from: { name: "me", address: "hermes@misfits.ai" },
    subject: "Re: Q3 Product Roadmap — Final Review",
    preview:
      "Looks great, Sarah. One question — do we need the AI assistant ready for public beta or just internal?",
    body: `<p>Looks great, Sarah.</p><p>One question — do we need the AI assistant ready for public beta or just internal? If public, we should move feature freeze to July 25.</p><p>Thanks!</p>`,
    folder: "sent",
    daysAgo: 0,
    hoursAgo: 1,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  {
    from: { name: "me", address: "hermes@misfits.ai" },
    subject: "Standup notes — July 28",
    preview:
      "Yesterday: Finished the email types and store. Today: Building the email list component. Blockers: None.",
    body: `<p><strong>Yesterday:</strong> Finished the email types and store.</p><p><strong>Today:</strong> Building the email list component.</p><p><strong>Blockers:</strong> None.</p>`,
    folder: "sent",
    daysAgo: 0,
    hoursAgo: 4,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  {
    from: { name: "me", address: "hermes@misfits.ai" },
    subject: "Re: Architecture decision — Redis vs. Valkey",
    preview:
      "Agreed on Valkey. Let's benchmark cluster mode vs. standalone this week. I'll set up the test environment.",
    body: `<p>Agreed on Valkey. Let's benchmark cluster mode vs. standalone this week.</p><p>I'll set up the test environment.</p>`,
    folder: "sent",
    daysAgo: 0,
    hoursAgo: 7,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  {
    from: { name: "me", address: "hermes@misfits.ai" },
    subject: "Welcome to the team — onboarding guide",
    preview:
      "Welcome aboard! I've put together a guide to help you get up to speed. First, set up your dev environment...",
    body: `<p>Welcome aboard!</p><p>I've put together a guide to help you get up to speed. First, set up your dev environment following the README, then schedule a 1:1.</p>`,
    folder: "sent",
    daysAgo: 3,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  {
    from: { name: "me", address: "hermes@misfits.ai" },
    subject: "Re: Weekend trip to Lisbon — flight options",
    preview:
      "Iberia sounds good! Let's book before the price goes up. I'll handle the hotel.",
    body: `Iberia sounds good!\n\nLet's book before the price goes up. I'll handle the hotel.\n\nSee you soon!`,
    folder: "sent",
    daysAgo: 1,
    hoursAgo: 2,
    isRead: true,
    labels: ["label-personal", "label-travel"],
    bodyType: "text",
  },
  // Drafts
  {
    from: { name: "me", address: "hermes@misfits.ai" },
    subject: "Draft: Proposal for new notification system",
    preview:
      "Hi team, I'd like to propose a new notification system that consolidates email, push, and in-app notifications...",
    body: `<p>Hi team,</p><p>I'd like to propose a new notification system that consolidates email, push, and in-app notifications into a single unified pipeline.</p><p>Key components:</p><ul><li>Notification queue (Valkey)</li><li>Delivery service (Rust)</li><li>Preferences API</li></ul><p>[DRAFT — TODO: add architecture diagram]</p>`,
    folder: "drafts",
    daysAgo: 0,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  {
    from: { name: "me", address: "hermes@misfits.ai" },
    subject: "Draft: Re: Security audit — preliminary findings",
    preview:
      "Thanks Tom. I'll review the CSP finding — I think we can add the nonce-based CSP headers in the next deploy...",
    body: `<p>Thanks Tom.</p><p>I'll review the CSP finding — I think we can add the nonce-based CSP headers in the next deploy.</p><p>[DRAFT — need to check with infra team]</p>`,
    folder: "drafts",
    daysAgo: 9,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  {
    from: { name: "me", address: "hermes@misfits.ai" },
    subject: "Draft: Vacation request — Sep 10-17",
    preview:
      "Hi, I'd like to request time off from Sep 10 to Sep 17 for a trip to Lisbon. Coverage plan: Marcus will handle...",
    body: `<p>Hi,</p><p>I'd like to request time off from Sep 10 to Sep 17 for a trip to Lisbon.</p><p>Coverage plan: Marcus will handle my on-call rotation.</p><p>[DRAFT]</p>`,
    folder: "drafts",
    daysAgo: 5,
    isRead: true,
    labels: ["label-personal"],
    bodyType: "html",
  },
  // Archive
  {
    from: { name: "Sarah Chen", address: "sarah.chen@misfits.ai" },
    subject: "Q2 Product Roadmap — Final Review",
    preview:
      "Hi team, I've attached the finalized Q2 roadmap. We shipped 14 features this quarter across the platform...",
    body: `<p>Hi team,</p><p>I've attached the finalized Q2 roadmap. We shipped <strong>14 features</strong> this quarter across the platform.</p><p>Great work everyone!</p>`,
    folder: "archive",
    daysAgo: 45,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  {
    from: { name: "Marcus Rodriguez", address: "marcus@misfits.ai" },
    subject: "Postmortem: May 3 API outage",
    preview:
      "On May 3, we experienced a 23-minute outage due to a DNS misconfiguration. Root cause and action items below...",
    body: `<p>On May 3, we experienced a <strong>23-minute outage</strong> due to a DNS misconfiguration.</p><p>Root cause: stale DNS cache after failover.</p><p>Action items completed.</p>`,
    folder: "archive",
    daysAgo: 60,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  {
    from: { name: "Vercel", address: "notifications@vercel.com" },
    subject: "Deployment succeeded for misfits-web (v0.9.0)",
    preview:
      "Your deployment to production was successful. Build completed in 38s.",
    body: `<p>Your deployment to <strong>production</strong> was successful.</p><p>Build completed in <strong>38s</strong>.</p>`,
    folder: "archive",
    daysAgo: 30,
    isRead: true,
    labels: [],
    bodyType: "html",
  },
  {
    from: { name: "GitHub", address: "noreply@github.com" },
    subject: "[misfits-web] PR #120 merged into master",
    preview:
      "Your pull request 'feat(#119): add TanStack Query setup' has been merged.",
    body: `<p>Your pull request <strong>'feat(#119): add TanStack Query setup'</strong> has been merged into <code>master</code>.</p>`,
    folder: "archive",
    daysAgo: 25,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  {
    from: { name: "AWS Billing", address: "billing@aws.amazon.com" },
    subject: "Your AWS bill for May 2026 is available",
    preview: "Your AWS account has a new bill of $2,510.89 for May 2026.",
    body: `<p>Your AWS account has a new bill of <strong>$2,510.89</strong> for May 2026.</p>`,
    folder: "archive",
    daysAgo: 70,
    isRead: true,
    labels: ["label-finance"],
    bodyType: "html",
  },
  {
    from: { name: "HR Department", address: "hr@misfits.ai" },
    subject: "Performance review schedule — Q1 2026",
    preview:
      "Performance reviews are scheduled for the week of March 10. Please complete self-assessments by March 5.",
    body: `<p>Performance reviews are scheduled for the week of <strong>March 10</strong>.</p><p>Please complete self-assessments by March 5.</p>`,
    folder: "archive",
    daysAgo: 140,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  {
    from: { name: "Ryan Park", address: "ryan@misfits.ai" },
    subject: "Re: Welcome to the team!",
    preview:
      "Welcome! Looking forward to working together. Let me know if you need anything.",
    body: `<p>Welcome! Looking forward to working together. Let me know if you need anything.</p>`,
    folder: "archive",
    daysAgo: 90,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  {
    from: { name: "Linear", address: "notifications@linear.app" },
    subject: "Sprint 24 retrospective notes",
    preview:
      "Sprint 24 completed with 12/14 issues resolved. Velocity trending up. Retro notes attached.",
    body: `<p>Sprint 24 completed with <strong>12/14 issues resolved</strong>. Velocity trending up.</p>`,
    folder: "archive",
    daysAgo: 35,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  {
    from: { name: "David Kim", address: "david.kim@misfits.ai" },
    subject: "Design system v1 — component inventory",
    preview:
      "Here's the full inventory of v1 components. 27 components total, all built on Radix primitives with our token system.",
    body: `<p>Here's the full inventory of v1 components. <strong>27 components</strong> total, all built on Radix primitives with our token system.</p>`,
    folder: "archive",
    daysAgo: 50,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  {
    from: { name: "Tom Anderson", address: "tom@misfits.ai" },
    subject: "Security audit — Q1 2026 complete",
    preview:
      "The Q1 security audit is complete. No critical findings. 3 medium and 5 low severity items logged for remediation.",
    body: `<p>The Q1 security audit is complete. No critical findings. <strong>3 medium</strong> and <strong>5 low</strong> severity items logged for remediation.</p>`,
    folder: "archive",
    daysAgo: 100,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  {
    from: { name: "Jenny Liu", address: "jenny.liu@misfits.ai" },
    subject: "Q1 hiring summary",
    preview:
      "We hired 4 engineers this quarter — 2 senior, 2 mid-level. Pipeline is strong for Q2 with 3 in final rounds.",
    body: `<p>We hired 4 engineers this quarter — 2 senior, 2 mid-level.</p><p>Pipeline is strong for Q2 with 3 in final rounds.</p>`,
    folder: "archive",
    daysAgo: 120,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  {
    from: {
      name: "The Pragmatic Engineer",
      address: "newsletter@substack.com",
    },
    subject: "Issue #210: The art of code review",
    preview:
      "This week: how great teams do code reviews at scale, with patterns from large organizations and small startups.",
    body: `<p>This week: how great teams do <strong>code reviews</strong> at scale, with patterns from large organizations and small startups.</p>`,
    folder: "archive",
    daysAgo: 50,
    isRead: true,
    labels: ["label-newsletter"],
    bodyType: "html",
  },
  // Trash
  {
    from: { name: "Promo Deals", address: "deals@promo-deals.com" },
    subject: "Last chance: 70% off everything ends tonight!",
    preview:
      "Don't miss out! 70% off our entire catalog. Use code SAVE70 at checkout. Offer expires at midnight.",
    body: `<p>Don't miss out! <strong>70% off</strong> our entire catalog. Use code <strong>SAVE70</strong> at checkout.</p>`,
    folder: "trash",
    daysAgo: 3,
    isRead: true,
    bodyType: "html",
  },
  {
    from: { name: "Newsletter Bot", address: "bot@technews.io" },
    subject: "Daily digest: 5 stories you missed yesterday",
    preview:
      "Here are 5 tech stories you might have missed yesterday including updates on AI regulation and new open source releases.",
    body: `<p>Here are 5 tech stories you might have missed yesterday.</p>`,
    folder: "trash",
    daysAgo: 4,
    isRead: true,
    bodyType: "html",
  },
  {
    from: { name: "Gym Plus", address: "noreply@gymplus.com" },
    subject: "Your membership renewal is due",
    preview:
      "Your Gym Plus membership expires in 7 days. Renew now to keep your current rate of $49/month.",
    body: `<p>Your Gym Plus membership expires in <strong>7 days</strong>. Renew now to keep your current rate of $49/month.</p>`,
    folder: "trash",
    daysAgo: 6,
    isRead: true,
    bodyType: "html",
  },
  {
    from: { name: "Unknown Sender", address: "noreply@unknown.xyz" },
    subject: "Verify your email address",
    preview:
      "Please verify your email address to continue using our service. Click the link below to confirm.",
    body: `<p>Please verify your email address to continue using our service.</p>`,
    folder: "trash",
    daysAgo: 8,
    isRead: true,
    bodyType: "html",
  },
  {
    from: { name: "Old Newsletter", address: "noreply@old-news.com" },
    subject: "We've updated our privacy policy",
    preview:
      "We've updated our privacy policy effective July 1, 2026. Please review the changes at the link below.",
    body: `<p>We've updated our privacy policy effective July 1, 2026.</p>`,
    folder: "trash",
    daysAgo: 10,
    isRead: true,
    bodyType: "html",
  },
  // ── Thread reply seeds (create multi-message conversations) ───────
  // Thread: roadmap-q3 (Sarah → me → Sarah)
  {
    from: { name: "Sarah Chen", address: "sarah.chen@misfits.ai" },
    subject: "Re: Q3 Product Roadmap — Final Review",
    preview:
      "Good point. Let's keep public beta scope minimal and push AI to internal. Updated the doc accordingly.",
    body: `<p>Good point.</p><p>Let's keep public beta scope minimal and push AI to internal. Updated the doc accordingly.</p><p>Sarah</p>`,
    folder: "inbox",
    daysAgo: 0,
    hoursAgo: 0,
    isRead: false,
    labels: ["label-work"],
    bodyType: "html",
  },
  // Thread: redis-valkey (me → Marcus → me) — original message
  {
    from: { name: "me", address: "hermes@misfits.ai" },
    subject: "Architecture decision — Redis vs. Valkey for caching",
    preview:
      "Team, we need to make a call on our caching layer. Redis license change means we should evaluate alternatives. Thoughts?",
    body: `<p>Team,</p><p>We need to make a call on our caching layer. The Redis license change means we should evaluate alternatives.</p><p>Thoughts?</p>`,
    folder: "sent",
    daysAgo: 0,
    hoursAgo: 12,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  // Thread: lunch (me → Ryan → me → Ryan)
  {
    from: { name: "me", address: "hermes@misfits.ai" },
    subject: "Lunch this week?",
    preview:
      "Hey Ryan, want to grab lunch this week? That new ramen place on 5th opened.",
    body: `<p>Hey Ryan,</p><p>Want to grab lunch this week? That new ramen place on 5th opened.</p>`,
    folder: "sent",
    daysAgo: 8,
    isRead: true,
    labels: ["label-personal"],
    bodyType: "html",
  },
  {
    from: { name: "Ryan Park", address: "ryan@misfits.ai" },
    subject: "Re: Lunch this week?",
    preview:
      "Sounds great! How about Wednesday? I've been wanting to try that place.",
    body: `<p>Sounds great! How about Wednesday? I've been wanting to try that place.</p>`,
    folder: "inbox",
    daysAgo: 7,
    hoursAgo: 20,
    isRead: true,
    labels: ["label-personal"],
    bodyType: "html",
  },
  {
    from: { name: "me", address: "hermes@misfits.ai" },
    subject: "Re: Re: Lunch this week?",
    preview:
      "Wednesday works for me. 12:30 at the ramen place? I'll book a table.",
    body: `<p>Wednesday works for me. 12:30 at the ramen place? I'll book a table.</p>`,
    folder: "sent",
    daysAgo: 7,
    hoursAgo: 10,
    isRead: true,
    labels: ["label-personal"],
    bodyType: "html",
  },
  // Thread: design-review (David → me)
  {
    from: { name: "me", address: "hermes@misfits.ai" },
    subject: "Re: New design system components ready for review",
    preview:
      "Looks great, David. I'll review the PR today. One question — should the command palette use cmd+k or ctrl+k on Windows?",
    body: `<p>Looks great, David.</p><p>I'll review the PR today. One question — should the command palette use <code>cmd+k</code> or <code>ctrl+k</code> on Windows?</p>`,
    folder: "sent",
    daysAgo: 1,
    hoursAgo: 8,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  // Thread: onboarding-fb (Jenny → me)
  {
    from: { name: "me", address: "hermes@misfits.ai" },
    subject: "Re: Onboarding feedback from new hires",
    preview:
      "Thanks Jenny, this is really helpful. I'll coordinate with the infra team on the staging environment access.",
    body: `<p>Thanks Jenny,</p><p>This is really helpful. I'll coordinate with the infra team on the staging environment access.</p>`,
    folder: "sent",
    daysAgo: 3,
    hoursAgo: 22,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  // Thread: rate-limiting (James → me → James)
  {
    from: { name: "me", address: "hermes@misfits.ai" },
    subject: "Re: API rate limiting — proposed approach",
    preview:
      "Token bucket looks good. Can we add a burst multiplier for paid tiers? Also, should we track per-IP as well?",
    body: `<p>Token bucket looks good. Can we add a burst multiplier for paid tiers? Also, should we track per-IP as well?</p>`,
    folder: "sent",
    daysAgo: 11,
    hoursAgo: 20,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  {
    from: { name: "James Cooper", address: "james@misfits.ai" },
    subject: "Re: API rate limiting — proposed approach",
    preview:
      "Good call on the burst multiplier. I'll add 2x for Pro and 5x for Enterprise. Per-IP tracking could create issues with shared NAT.",
    body: `<p>Good call on the burst multiplier. I'll add <strong>2x</strong> for Pro and <strong>5x</strong> for Enterprise.</p><p>Per-IP tracking could create issues with shared NAT — let's keep it per-user for now.</p><p>James</p>`,
    folder: "inbox",
    daysAgo: 11,
    hoursAgo: 10,
    isRead: false,
    labels: ["label-work"],
    bodyType: "html",
  },
  // Thread: api-outage (Alex → me)
  {
    from: { name: "me", address: "hermes@misfits.ai" },
    subject: "Re: Postmortem: July 14 API outage",
    preview:
      "Thanks Alex. The connection pool fix is deployed. Let's add the autoscaling alert in this sprint — I'll create the ticket.",
    body: `<p>Thanks Alex.</p><p>The connection pool fix is deployed. Let's add the autoscaling alert in this sprint — I'll create the ticket.</p>`,
    folder: "sent",
    daysAgo: 2,
    hoursAgo: 22,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  // Thread: benefits (HR → me)
  {
    from: { name: "me", address: "hermes@misfits.ai" },
    subject: "Re: Open enrollment: benefits selection",
    preview:
      "Hi, I've submitted my selections through the portal. Can you confirm receipt? Also, is there a FSA option this year?",
    body: `<p>Hi,</p><p>I've submitted my selections through the portal. Can you confirm receipt? Also, is there a FSA option this year?</p>`,
    folder: "sent",
    daysAgo: 6,
    hoursAgo: 22,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
  // Thread: q2-retro (Victoria → me)
  {
    from: { name: "me", address: "hermes@misfits.ai" },
    subject: "Re: Q2 retrospective notes — action items",
    preview:
      "Thanks Victoria. I've added the items to the tracker and assigned owners. Let's review at the next planning meeting.",
    body: `<p>Thanks Victoria.</p><p>I've added the items to the tracker and assigned owners. Let's review at the next planning meeting.</p>`,
    folder: "sent",
    daysAgo: 15,
    hoursAgo: 22,
    isRead: true,
    labels: ["label-work"],
    bodyType: "html",
  },
];

/* ────────────────────────────────────────────────────────────────── */
/* Thread assignment maps: assign related seeds to shared thread IDs  */
/* and define In-Reply-To / References chains for RFC 5322 threading.  */
/* Key = seed index (0-based), Value = thread ID or seed index ref.    */
/* ────────────────────────────────────────────────────────────────── */

/** Deterministic Message-ID generator (stable across reloads). */
function seedMessageId(i: number): string {
  return `<email-${String(i + 1).padStart(3, "0")}@misfits.ai>`;
}

/** Map: seed index → thread ID. Seeds not listed get a unique singleton thread. */
const threadMap: Record<number, string> = {
  // Existing seeds grouped into threads
  0: "thread-roadmap-q3", // Sarah: Q3 roadmap
  2: "thread-redis-valkey", // Marcus: Re: Redis vs Valkey
  5: "thread-lisbon-trip", // Emily: Lisbon flights
  7: "thread-design-review", // David: Design components
  12: "thread-api-outage", // Alex: Postmortem
  15: "thread-onboarding-fb", // Jenny: Onboarding feedback
  17: "thread-lisbon-trip", // Booking.com: Lisbon reservation
  19: "thread-benefits", // HR: Open enrollment
  20: "thread-lunch", // Ryan: Re:Re:Re: Lunch
  23: "thread-security-audit", // Tom: Security audit
  25: "thread-rate-limiting", // James: Rate limiting
  29: "thread-q2-retro", // Victoria: Q2 retro
  34: "thread-roadmap-q3", // me: Re: Q3 roadmap
  36: "thread-redis-valkey", // me: Re: Redis vs Valkey
  38: "thread-lisbon-trip", // me: Re: Lisbon flights
  40: "thread-security-audit", // me: Draft: Re: Security audit
  // New reply seeds (indices 59+)
  59: "thread-roadmap-q3", // Sarah: Re: Q3 roadmap (reply to my reply)
  60: "thread-redis-valkey", // me: Architecture decision (original)
  61: "thread-lunch", // me: Lunch? (original)
  62: "thread-lunch", // Ryan: Re: Lunch
  63: "thread-lunch", // me: Re: Re: Lunch
  64: "thread-design-review", // me: Re: Design components
  65: "thread-onboarding-fb", // me: Re: Onboarding feedback
  66: "thread-rate-limiting", // me: Re: Rate limiting
  67: "thread-rate-limiting", // James: Re: Rate limiting (reply)
  68: "thread-api-outage", // me: Re: Postmortem
  69: "thread-benefits", // me: Re: Benefits
  70: "thread-q2-retro", // me: Re: Q2 retro
};

/** Map: seed index → seed index it replies to (for In-Reply-To header). */
const inReplyToMap: Record<number, number> = {
  2: 60, // Marcus replies to my original (seed 60)
  20: 63, // Ryan replies to my "Re: Re: Lunch" (seed 63)
  34: 0, // my reply to Sarah's roadmap (seed 0)
  36: 2, // my reply to Marcus (seed 2)
  38: 5, // my reply to Emily (seed 5)
  40: 23, // my draft reply to Tom (seed 23)
  59: 34, // Sarah replies to my reply (seed 34)
  62: 61, // Ryan replies to my original (seed 61)
  63: 62, // I reply to Ryan (seed 62)
  64: 7, // I reply to David (seed 7)
  65: 15, // I reply to Jenny (seed 15)
  66: 25, // I reply to James (seed 25)
  67: 66, // James replies to my reply (seed 66)
  68: 12, // I reply to Alex (seed 12)
  69: 19, // I reply to HR (seed 19)
  70: 29, // I reply to Victoria (seed 29)
};

/** Map: seed index → list of seed indices in the References chain. */
const referencesMap: Record<number, number[]> = {
  2: [60],
  20: [61, 62, 63],
  34: [0],
  36: [60, 2],
  38: [5],
  40: [23],
  59: [0, 34],
  62: [61],
  63: [61, 62],
  64: [7],
  65: [15],
  66: [25],
  67: [25, 66],
  68: [12],
  69: [19],
  70: [29],
};

export const mockEmails: Email[] = seeds.map((s, i) => {
  const date = daysAgo(s.daysAgo, s.hoursAgo ?? 0);
  const msgId = seedMessageId(i);
  const tid = threadMap[i] ?? `thread-${String(i + 1).padStart(3, "0")}`;
  const inReplyToSeed = inReplyToMap[i];
  const inReplyTo =
    inReplyToSeed !== undefined ? seedMessageId(inReplyToSeed) : undefined;
  const refSeeds = referencesMap[i];
  const references = refSeeds ? refSeeds.map(seedMessageId) : undefined;
  return {
    id: `email-${String(i + 1).padStart(3, "0")}`,
    threadId: tid,
    folder: s.folder,
    from: s.from,
    to: [{ name: "me", address: "hermes@misfits.ai" }],
    subject: s.subject,
    preview: s.preview,
    body: s.body,
    bodyType: s.bodyType ?? "html",
    date,
    receivedAt: date,
    isRead: s.isRead ?? false,
    isStarred: s.isStarred ?? false,
    isImportant: s.isImportant ?? false,
    hasAttachments: (s.attachments?.length ?? 0) > 0,
    attachments: s.attachments ?? [],
    labels: s.labels ?? [],
    size: s.body.length + (s.attachments?.reduce((a, x) => a + x.size, 0) ?? 0),
    messageId: msgId,
    inReplyTo,
    references,
    headers: {},
    accountId: "acc-1",
  };
});

export function getMockEmailById(id: string): Email | undefined {
  return mockEmails.find((e) => e.id === id);
}

export function getMockEmailsByFolder(folder: string): Email[] {
  return mockEmails.filter((e) => e.folder === folder);
}
