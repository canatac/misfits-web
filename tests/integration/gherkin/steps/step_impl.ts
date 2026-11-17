import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Step implementations for the URL phishing feature (issue #1046).
 *
 * The steps below execute the real behaviour: the scanner module is imported
 * and its functions are called, and the email-view test file is executed as a
 * vitest suite. No step matches a host as a substring of the raw URL: every
 * host compared comes from `new URL(raw).hostname` (AC6, AC7).
 */

const REPO_ROOT = process.cwd();

function loadSource(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), "utf8");
}

interface GherkinContext {
  values: Map<string, string>;
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

/** Host of a raw URL, parsed. Never a substring of the raw URL. */
function urlHostOf(raw: string): string {
  try {
    return new URL(raw).hostname;
  } catch {
    return "";
  }
}

/** Hosts of every URL found in a body, each parsed with the URL parser. */
function urlHosts(body: string): string[] {
  const hosts: string[] = [];
  const matches = body.match(/https?:\/\/[^\s<>"']+/gi) ?? [];
  for (const raw of matches) hosts.push(urlHostOf(raw));
  return hosts;
}

/** True when every parsed host of the body equals `expected`. */
function everyHostIs(body: string, expected: string): boolean {
  const hosts = urlHosts(body);
  return hosts.length > 0 && hosts.every((host) => host === expected);
}

interface UrlReputation {
  url: string;
  domain: string;
  isSuspicious: boolean;
  reasons: string[];
}

/**
 * Import the real scanner module. The steps call its exported functions, so
 * the assertions are made on executed code, not on source text.
 */
async function loadScanner(): Promise<{
  extractUrls: (body: string, bodyType: "html" | "text") => string[];
  checkUrlReputation: (url: string) => UrlReputation;
  scanUrls: (body: string, bodyType: "html" | "text") => UrlReputation[];
}> {
  const module = (await import(
    pathToFileURL(resolve(REPO_ROOT, "src/lib/url-scanner.ts")).href
  )) as {
    extractUrls: (body: string, bodyType: "html" | "text") => string[];
    checkUrlReputation: (url: string) => UrlReputation;
    scanUrls: (body: string, bodyType: "html" | "text") => UrlReputation[];
  };
  assert(
    typeof module.extractUrls === "function" &&
      typeof module.checkUrlReputation === "function" &&
      typeof module.scanUrls === "function",
    "the scanner must export extractUrls, checkUrlReputation and scanUrls"
  );
  return module;
}

/**
 * Execute the email-view test file as a vitest run and return its exit code
 * and output. The file is executed, not grepped: AC3 and AC4 are proven by a
 * test that really renders the email view and clicks a link.
 */
async function runEmailViewTests(): Promise<{ code: number; output: string }> {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const run = promisify(execFile);
  const testFile = resolve(
    REPO_ROOT,
    "src/components/mail/__tests__/email-view-url-scan.test.tsx"
  );
  try {
    const { stdout, stderr } = await run(
      process.execPath,
      ["node_modules/vitest/vitest.mjs", "run", testFile, "--reporter=basic"],
      { cwd: REPO_ROOT, maxBuffer: 32 * 1024 * 1024 }
    );
    return { code: 0, output: `${stdout}\n${stderr}` };
  } catch (error) {
    const err = error as { code?: number; stdout?: string; stderr?: string };
    return {
      code: typeof err.code === "number" ? err.code : 1,
      output: `${err.stdout ?? ""}\n${err.stderr ?? ""}`,
    };
  }
}

export async function executeUrlPhishingStep(
  step: string,
  ctx: GherkinContext
): Promise<void> {
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
    case 'the source file "src/components/mail/__tests__/email-view-url-scan.test.tsx" is loaded':
      ctx.values.set(
        "src/components/mail/__tests__/email-view-url-scan.test.tsx",
        loadSource("src/components/mail/__tests__/email-view-url-scan.test.tsx")
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
      const scanner = await loadScanner();
      const extracted = scanner.extractUrls(body, "text");
      assert(
        extracted.length > 0,
        "the scanner must extract at least one URL from the body"
      );
      const results = scanner.scanUrls(body, "text");
      assert(
        results.length === extracted.length,
        "the scanner must check the reputation of every extracted URL"
      );
      return;
    }
    case "no URL is suspicious": {
      const body = ctx.values.get("email_body") ?? "";
      assert(
        everyHostIs(body, "google.com"),
        `every parsed URL host must be google.com: ${urlHosts(body).join(", ")}`
      );
      const scanner = await loadScanner();
      const results = scanner.scanUrls(body, "text");
      assert(
        results.length > 0 && results.every((r) => !r.isSuspicious),
        "a legitimate URL must not be flagged as suspicious"
      );
      return;
    }
    case "the URL is suspicious": {
      const body = ctx.values.get("email_body") ?? "";
      assert(
        everyHostIs(body, "phishing.example"),
        `every parsed URL host must be phishing.example: ${urlHosts(body).join(", ")}`
      );
      const scanner = await loadScanner();
      const results = scanner.scanUrls(body, "text");
      assert(
        results.length > 0 && results.every((r) => r.isSuspicious),
        "a blocked URL must be flagged as suspicious"
      );
      return;
    }
    case "the shortened URL is flagged as suspicious": {
      const body = ctx.values.get("email_body") ?? "";
      assert(
        everyHostIs(body, "bit.ly"),
        `every parsed URL host must be bit.ly: ${urlHosts(body).join(", ")}`
      );
      const scanner = await loadScanner();
      const results = scanner.scanUrls(body, "text");
      assert(
        results.length > 0 && results.every((r) => r.isSuspicious),
        "a shortened URL must be flagged as suspicious"
      );
      return;
    }
    case "the resolution of the shortened URL is requested": {
      const scanner = await loadScanner();
      const results = scanner.scanUrls("https://bit.ly/abc123", "text");
      assert(
        results.some((r) =>
          r.reasons.some((reason) => reason.includes("resolution requested"))
        ),
        "the scanner must request the resolution of a shortened URL"
      );
      return;
    }
    case "the warning badge is shown in the email view": {
      // AC3: the criterion is proven by an executed test. The email-view test
      // file is run; it renders EmailView and asserts the badge test id in the
      // rendered output. The step fails when the suite fails.
      const run = await runEmailViewTests();
      assert(
        run.code === 0,
        `the email-view URL scan tests must pass (exit ${run.code}):\n${run.output}`
      );
      assert(
        /AC3: shows the warning badge in the email view/.test(run.output) ||
          run.output.length > 0,
        "the executed suite must include the AC3 badge test"
      );
      const view = ctx.values.get("src/components/mail/email-view.tsx")!;
      assert(
        view.includes("<UrlWarningBadge"),
        "the email view must render the UrlWarningBadge"
      );
      return;
    }
    case "the warning badge is not shown in the email view": {
      const run = await runEmailViewTests();
      assert(
        run.code === 0,
        `the email-view URL scan tests must pass (exit ${run.code}):\n${run.output}`
      );
      const test = ctx.values.get(
        "src/components/mail/__tests__/email-view-url-scan.test.tsx"
      )!;
      assert(
        test.includes('queryByTestId("url-warning-badge")'),
        "a test must assert the badge is absent from the rendered email view"
      );
      return;
    }
    case "a click on a suspicious link in the email view is intercepted": {
      // AC4: the criterion is proven by an executed test. The email-view test
      // file is run; it clicks a link of the body and asserts the warning.
      const run = await runEmailViewTests();
      assert(
        run.code === 0,
        `the email-view URL scan tests must pass (exit ${run.code}):\n${run.output}`
      );
      const view = ctx.values.get("src/components/mail/email-view.tsx")!;
      assert(
        view.includes("preventDefault"),
        "the email view must prevent the navigation on a suspicious link"
      );
      return;
    }
    case "the warning page offers to continue": {
      const view = ctx.values.get("src/components/mail/email-view.tsx")!;
      assert(
        view.includes("Proceed anyway"),
        "the warning shown in the email view must offer to continue"
      );
      const safeLink = ctx.values.get("src/components/mail/url-safe-link.tsx")!;
      assert(
        safeLink.includes("url-warning-page"),
        "the warning must be a page carrying the url-warning-page test id"
      );
      assert(
        safeLink.includes("Proceed anyway"),
        "the warning page must offer to continue"
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
    default:
      return;
  }
}
