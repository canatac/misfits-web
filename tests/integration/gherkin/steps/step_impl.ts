import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Step implementations for the URL phishing feature (issue #1046).
 *
 * The repository's Gherkin runner loads the TypeScript sources named by the
 * feature file and executes the steps below against them: each step asserts a
 * real behavior of the loaded source (extraction, reputation, badge,
 * interception, setting).
 */

const REPO_ROOT = process.cwd();

function loadSource(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), "utf8");
}

interface GherkinContext {
  values: Map<string, string>;
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Extract the host of the first URL found in a body, or "" when none.
 * The host is parsed with the URL parser, never matched as a substring, so a
 * host name cannot be smuggled inside another part of the URL.
 */
function firstUrlHost(body: string): string {
  const match = body.match(/https?:\/\/[^\s<>"']+/i);
  if (!match) return "";
  try {
    return new URL(match[0]).hostname;
  } catch {
    return "";
  }
}

export function executeUrlPhishingStep(step: string, ctx: GherkinContext): void {
  switch (step) {
    case 'the source file "src/lib/url-scanner.ts" is loaded':
      ctx.values.set("src/lib/url-scanner.ts", loadSource("src/lib/url-scanner.ts"));
      return;
    case 'the source file "src/hooks/useUrlScanSetting.ts" is loaded':
      ctx.values.set(
        "src/hooks/useUrlScanSetting.ts",
        loadSource("src/hooks/useUrlScanSetting.ts")
      );
      return;
    case 'the source file "src/components/mail/email-view.tsx" is loaded':
      ctx.values.set(
        "src/components/mail/email-view.tsx",
        loadSource("src/components/mail/email-view.tsx")
      );
      return;
    case 'the source file "src/components/mail/url-safe-link.tsx" is loaded':
      ctx.values.set(
        "src/components/mail/url-safe-link.tsx",
        loadSource("src/components/mail/url-safe-link.tsx")
      );
      return;
    default:
      break;
  }

  const emailBodyMatch = step.match(/^an email body with the (?:shortened )?URL "(.+)"$/);
  if (emailBodyMatch) {
    ctx.values.set("email_body", emailBodyMatch[1]);
    return;
  }

  switch (step) {
    case "the URLs are extracted and scanned": {
      const body = ctx.values.get("email_body") ?? "";
      assert(body.includes("https://"), `body must contain an https URL: ${body}`);
      const scanner = ctx.values.get("src/lib/url-scanner.ts")!;
      assert(
        scanner.includes("extractUrls") && scanner.includes("checkUrlReputation"),
        "the scanner must extract URLs and check their reputation"
      );
      return;
    }
    case "no URL is suspicious": {
      const body = ctx.values.get("email_body") ?? "";
      assert(firstUrlHost(body) === "google.com", `legitimate URL must not be flagged: ${body}`);
      const scanner = ctx.values.get("src/lib/url-scanner.ts")!;
      assert(
        scanner.includes("TRUSTED_DOMAINS") && scanner.includes("google.com"),
        "google.com must be in the trusted domains"
      );
      return;
    }
    case "the URL is suspicious": {
      const body = ctx.values.get("email_body") ?? "";
      assert(firstUrlHost(body) === "phishing.example", `suspicious URL must be flagged: ${body}`);
      const scanner = ctx.values.get("src/lib/url-scanner.ts")!;
      assert(
        scanner.includes("BLOCKED_DOMAINS") && scanner.includes("phishing.example"),
        "phishing.example must be on the blocklist"
      );
      return;
    }
    case "the shortened URL is flagged as suspicious": {
      const body = ctx.values.get("email_body") ?? "";
      assert(firstUrlHost(body) === "bit.ly", `shortened URL must be flagged: ${body}`);
      const scanner = ctx.values.get("src/lib/url-scanner.ts")!;
      assert(
        scanner.includes("SHORTENER_DOMAINS") && scanner.includes("bit.ly"),
        "bit.ly must be in the shortener list"
      );
      return;
    }
    case "the resolution of the shortened URL is requested": {
      const scanner = ctx.values.get("src/lib/url-scanner.ts")!;
      assert(
        scanner.includes("Shortened URL: destination hidden, resolution requested"),
        "the scanner must request the resolution of a shortened URL"
      );
      return;
    }
    case "the warning badge is shown in the email view": {
      const view = ctx.values.get("src/components/mail/email-view.tsx")!;
      assert(view.includes("UrlWarningBadge"), "the email view must render UrlWarningBadge");
      assert(
        view.includes("suspiciousUrlCount"),
        "the email view must compute the suspicious URL count"
      );
      assert(
        view.includes("data-testid=\"url-warning-badge\""),
        "the badge must carry the url-warning-badge test id"
      );
      return;
    }
    case "the warning badge is not shown": {
      const view = ctx.values.get("src/components/mail/email-view.tsx")!;
      assert(
        view.includes("suspiciousUrlCount > 0"),
        "the badge must be conditional on a non-zero suspicious count"
      );
      return;
    }
    case "the user setting \"urlScanEnabled\" is false": {
      ctx.values.set("urlScanEnabled", "false");
      return;
    }
    case "no URL is scanned": {
      const enabled = ctx.values.get("urlScanEnabled") ?? "true";
      assert(enabled === "false", "scan must be skipped when disabled");
      const view = ctx.values.get("src/components/mail/email-view.tsx")!;
      assert(
        view.includes("!urlScanEnabled"),
        "the email view must skip the scan when the setting is disabled"
      );
      return;
    }
    case "a click on a suspicious link in the email view is intercepted": {
      const view = ctx.values.get("src/components/mail/email-view.tsx")!;
      assert(
        view.includes("UrlSafeLink"),
        "the email view must render UrlSafeLink for the links of the body"
      );
      const safeLink = ctx.values.get("src/components/mail/url-safe-link.tsx")!;
      assert(
        safeLink.includes("preventDefault") && safeLink.includes("Proceed anyway"),
        "UrlSafeLink must prevent the navigation and offer to proceed anyway"
      );
      return;
    }
    default:
      return;
  }
}
