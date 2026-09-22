/**
 * Built-in email templates for the composer.
 * Five templates covering common send scenarios.
 */

export type TemplateCategory =
  "onboarding" | "meeting" | "follow-up" | "billing" | "marketing";

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  /** HTML body. */
  body: string;
  category: TemplateCategory;
  /** Short description shown in the template picker. */
  description: string;
}

export const emailTemplates: EmailTemplate[] = [
  {
    id: "tpl-welcome",
    name: "Welcome",
    subject: "Welcome to misfits.ai, {{name}}!",
    category: "onboarding",
    description: "Greet a new user and point them to getting started.",
    body: `<p>Hi {{name}},</p><p>Welcome to <strong>misfits.ai Mail</strong>! We're thrilled to have you on board.</p><p>Here are a few things to get you started:</p><ul><li>Set up your profile and signature</li><li>Connect additional accounts</li><li>Explore keyboard shortcuts (press <code>?</code> any time)</li></ul><p>If you have any questions, just reply to this email.</p><p>Cheers,<br/>The misfits.ai Team</p>`,
  },
  {
    id: "tpl-meeting",
    name: "Meeting invite",
    subject: "Meeting: {{topic}} — {{date}}",
    category: "meeting",
    description: "Invite a recipient to a meeting with agenda and details.",
    body: `<p>Hi {{name}},</p><p>I'd like to schedule a meeting to discuss <strong>{{topic}}</strong>.</p><p><strong>When:</strong> {{date}}<br/><strong>Where:</strong> {{location}}<br/><strong>Duration:</strong> 30 minutes</p><p><strong>Agenda:</strong></p><ol><li>Context and goals</li><li>Open questions</li><li>Next steps</li></ol><p>Please confirm or suggest an alternative time.</p><p>Best,<br/>{{sender}}</p>`,
  },
  {
    id: "tpl-followup",
    name: "Follow-up",
    subject: "Following up on: {{topic}}",
    category: "follow-up",
    description: "Polite follow-up after no response.",
    body: `<p>Hi {{name}},</p><p>I hope you're doing well. I'm following up on my previous message about <strong>{{topic}}</strong>.</p><p>Whenever you have a moment, I'd love to hear your thoughts. Happy to jump on a quick call if that's easier.</p><p>Thanks,<br/>{{sender}}</p>`,
  },
  {
    id: "tpl-invoice",
    name: "Invoice",
    subject: "Invoice #{{number}} from misfits.ai",
    category: "billing",
    description: "Send an invoice with payment details.",
    body: `<p>Hi {{name}},</p><p>Please find attached invoice <strong>#{{number}}</strong> for the amount of <strong>{{amount}}</strong>.</p><p>Payment is due within 30 days. You can pay via bank transfer or card using the link in the invoice.</p><p>If you have any questions about this invoice, don't hesitate to reach out.</p><p>Regards,<br/>{{sender}}<br/>Finance, misfits.ai</p>`,
  },
  {
    id: "tpl-newsletter",
    name: "Newsletter",
    subject: "misfits.ai Digest — {{month}}",
    category: "marketing",
    description: "Monthly digest of product updates and news.",
    body: `<p>Hi {{name}},</p><p>Here's your <strong>{{month}}</strong> digest from misfits.ai:</p><h3>What's new</h3><ul><li>New composer with rich text editing</li><li>Improved search performance</li><li>Dark mode refinements</li></ul><h3>From the blog</h3><ul><li>Designing for focus</li><li>The future of AI-assisted email</li></ul><p>Read the full update on our blog.</p><p>Until next time,<br/>The misfits.ai Team</p>`,
  },
];

/**
 * Replace {{placeholders}} in subject/body with provided values.
 */
export function applyTemplate(
  template: EmailTemplate,
  vars: Record<string, string>
): { subject: string; body: string } {
  const replace = (s: string) =>
    s.replace(/\{\{(\w+)\}\}/g, (_m, key: string) => vars[key] ?? `{{${key}}}`);
  return { subject: replace(template.subject), body: replace(template.body) };
}
