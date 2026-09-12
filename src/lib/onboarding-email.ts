export interface OnboardingEmail { day: number; subject: string; body: string; tags: string[] }
export interface UserContext { name: string; email: string; plan: "free" | "pro" | "enterprise"; signupDate: Date }

export function buildWelcomeEmail(ctx: UserContext): OnboardingEmail {
  return { day: 0, subject: `Welcome aboard, ${ctx.name}! Here's what to do first`, body: `<p>Hi ${ctx.name},</p>\n<p>Welcome to misfits! Your ${ctx.plan} account is ready.</p>\n<p>&mdash; The misfits team</p>`, tags: ["onboarding","welcome",`plan:${ctx.plan}`] };
}

export function buildTipsEmail(ctx: UserContext): OnboardingEmail {
  return { day: 2, subject: `${ctx.name}, 3 ways to speed up your inbox`, body: `<p>Hi ${ctx.name},</p>\n<ol><li>Keyboard shortcuts</li><li>First filter</li><li>Batch actions</li></ol>`, tags: ["onboarding","tips"] };
}

export function buildFeedbackEmail(ctx: UserContext): OnboardingEmail {
  return { day: 7, subject: `${ctx.name}, how's misfits working for you?`, body: `<p>Hi ${ctx.name},</p>\p>Let us know!</p>`, tags: ["onboarding","feedback"] };
}

export function buildOnboardingSequence(ctx: UserContext): OnboardingEmail[] {
  return [buildWelcomeEmail(ctx), buildTipsEmail(ctx), buildFeedbackEmail(ctx)];
}

export function scheduleDate(signupDate: Date, day: number): Date {
  const d = new Date(signupDate); d.setDate(d.getDate() + day); return d;
}

export function emailsDueBy(signupDate: Date, today: Date, sequence: OnboardingEmail[]): OnboardingEmail[] {
  const diffDays = Math.floor((today.getTime() - signupDate.getTime()) / 86400000);
  return sequence.filter((e) => e.day <= diffDays);
}
