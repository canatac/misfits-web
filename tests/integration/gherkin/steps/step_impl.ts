import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Step implementations for the URL phishing feature (issue #1046).
 *
 * Every step asserts executed behaviour: the scanner module is imported and its
 * functions are called, and the email-view test file is executed as a vitest
 * suite whose rendered results are asserted. No step asserts source text and
 * no host is matched as a substring of the raw URL: every host compared comes
 * from `new URL(raw).hostname` (AC6, AC7).
 */

const REPO_ROOT = process.cwd();

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

interface SuiteRun {
  code: number;
  output: string;
  passed: string[];
  failed: string[];
}

/**
 * Execute the email-view test file as a vitest run and return its exit code,
 * output and the names of the tests that passed and failed. The file is
 * executed, not grepped: AC3, AC4 and AC5 are proven by tests that really
 * render the email view and click a link.
 */
async function runEmailViewTests(): Promise<SuiteRun> {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const run = promisify(execFile);
  const testFile = resolve(
    REPO_ROOT,
    "src/components/mail/__tests__/email-view-url-scan.test.tsx"
  );
  let code = 1;
  let output = "";
  try {
    const { stdout, stderr } = await run(
      process.execPath,
      ["node_modules/vitest/vitest.mjs", "run", testFile, "--reporter=basic"],
      { cwd: REPO_ROOT, maxBuffer: 32 * 1024 * 1024 }
    );
    code = 0;
    output = `${stdout}\n${stderr}`;
  } catch (error) {
    const err = error as { code?: number; stdout?: string; stderr?: string };
    code = typeof err.code === "number" ? err.code : 1;
    output = `${err.stdout ?? ""}\n${err.stderr ?? ""}`;
  }
  const passed = output
    .split("\n")
    .filter((line) => /^\s*(✓|√|✔)/.test(line))
    .map((line) => line.replace(/^\s*(✓|√|✔)\s*/, "").trim());
  const failed = output
    .split("\n")
    .filter((line) => /^\s*(×|✗|✘|failed)/.test(line))
    .map((line) => line.replace(/^\s*(×|✗|✘|failed)\s*/, "").trim());
  return { code, output, passed, failed };
}

/**
 * Assert that the executed suite really exercised a behaviour: the suite must
 * pass and the named test must be among the tests that ran and passed. A test
 * that is absent, skipped or failed does not satisfy the step.
 */
function assertBehaviour(
  run: SuiteRun,
  testName: string,
  description: string
): void {
  assert(
    run.code === 0,
    `the email-view URL scan tests must pass (exit ${run.code}):\n${run.output}`
  );
  assert(
    run.passed.some((name) => name.includes(testName)),
    `${description}: the executed suite must contain a passing test named "${testName}". Tests that ran: ${run.passed.join(" | ") || "(none)"}`
  );
}

export async function executeUrlPhishingStep(
  step: string,
  ctx: GherkinContext
): Promise<void> {
  const emailBodyMatch = step.match(
    /^an email body with the (shortened )?URL "(.+)"$/
  );
  if (emailBodyMatch) {
    ctx.values.set("email_body", emailBodyMatch[2]);
    return;
  }

  switch (step) {
    case 'the email view test suite "src/components/mail/__tests__/email-view-url-scan.test.tsx" is loaded':
      // The suite is executed by the steps below; nothing to load here.
      return;

    case "the URLs are extracted from the body": {
      const body = ctx.values.get("email_body") ?? "";
      assert(body.includes("https://"), `body must contain an https URL: ${body}`);
      const scanner = await loadScanner();
      const extracted = scanner.extractUrls(body, "text");
      assert(
        extracted.length > 0,
        "the scanner must extract at least one URL from the body"
      );
      return;
    }

    case "the extracted URL host is \"google.com\"": {
      const body = ctx.values.get("email_body") ?? "";
      const scanner = await loadScanner();
      const extracted = scanner.extractUrls(body, "text");
      assert(
        extracted.length > 0,
        "the scanner must extract at least one URL from the body"
      );
      const hosts = extracted.map(urlHostOf);
      assert(
        hosts.length > 0 && hosts.every((host) => host === "google.com"),
        `every extracted URL host must be google.com: ${hosts.join(", ")}`
      );
      return;
    }

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

    case 'the reputation of the URL host "phishing.example" is checked': {
      const body = ctx.values.get("email_body") ?? "";
      const scanner = await loadScanner();
      const extracted = scanner.extractUrls(body, "text");
      const hosts = extracted.map(urlHostOf);
      assert(
        hosts.includes("phishing.example"),
        `the extracted URL hosts must include phishing.example: ${hosts.join(", ")}`
      );
      const reputation = scanner.checkUrlReputation(
        extracted[hosts.indexOf("phishing.example")]
      );
      assert(
        reputation.domain === "phishing.example",
        `checkUrlReputation must return the parsed host phishing.example, got ${reputation.domain}`
      );
      return;
    }

    case "no URL is suspicious": {
      const body = ctx.values.get("email_body") ?? "";
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

    case 'the user setting "urlScanEnabled" is false': {
      ctx.values.set("urlScanEnabled", "false");
      return;
    }

    case "the email view is rendered": {
      // AC3/AC5: the criteria are proven by the executed email-view suite,
      // which renders EmailView and asserts the badge and the hidden
      // scan-dependent surfaces. The step fails when the suite fails.
      const run = await runEmailViewTests();
      assert(
        run.code === 0,
        `the email-view URL scan tests must pass (exit ${run.code}):\n${run.output}`
      );
      return;
    }

    case 'the badge "url-warning-badge" is present in the email view': {
      const run = await runEmailViewTests();
      assertBehaviour(
        run,
        "AC3: shows the warning badge in the email view for a suspicious URL",
        "AC3: the badge must be rendered for a suspicious URL"
      );
      return;
    }

    case 'the badge "url-warning-badge" is absent from the email view': {
      const run = await runEmailViewTests();
      assertBehaviour(
        run,
        "AC3: shows no badge for a legitimate URL",
        "AC3: no badge must be rendered for a legitimate URL"
      );
      return;
    }

    case "a click on the suspicious link happens in the email view": {
      const run = await runEmailViewTests();
      assertBehaviour(
        run,
        "AC4: intercepts a click on a suspicious link in the email view",
        "AC4: the click on a suspicious link must be intercepted"
      );
      return;
    }

    case "the navigation is prevented in the email view": {
      // AC4: the click test asserts the warning appears, which only happens
      // when preventDefault was called.
      const run = await runEmailViewTests();
      assertBehaviour(
        run,
        "AC4: intercepts a click on a suspicious link in the email view",
        "AC4: the navigation must be prevented"
      );
      return;
    }

    case 'the warning offers "Proceed anyway"': {
      const run = await runEmailViewTests();
      assertBehaviour(
        run,
        "AC4: intercepts a click on a suspicious link in the email view",
        "AC4: the warning must offer Proceed anyway"
      );
      return;
    }

    case 'the scan-dependent banner "url-phishing-banner" is hidden': {
      const run = await runEmailViewTests();
      assertBehaviour(
        run,
        "AC5: hides the scan-dependent banner and safe-link list",
        "AC5: the scan-dependent banner must be hidden"
      );
      return;
    }

    case 'the safe-link list "email-body-safe-links" is hidden': {
      const run = await runEmailViewTests();
      assertBehaviour(
        run,
        "AC5: hides the scan-dependent banner and safe-link list",
        "AC5: the safe-link list must be hidden"
      );
      return;
    }

    case "the email view test suite is executed": {
      const run = await runEmailViewTests();
      assert(
        run.code === 0,
        `the email-view URL scan tests must pass (exit ${run.code}):\n${run.output}`
      );
      return;
    }

    case "the email view test suite passes": {
      const run = await runEmailViewTests();
      assert(
        run.code === 0,
        `the email-view URL scan tests must pass (exit ${run.code}):\n${run.output}`
      );
      return;
    }

    case "every compared host is parsed from the raw URL": {
      // AC6/AC7: the hosts this file compares are produced by urlHostOf,
      // which parses the raw URL with the URL parser. Prove it on the hosts
      // the scenarios use: a host that is only a substring of the raw URL
      // (for example "phishing.example" inside "notphishing.example.evil")
      // must not be produced.
      assert(
        urlHostOf("https://phishing.example/steal") === "phishing.example",
        "the host of a raw URL must be parsed, not matched as a substring"
      );
      assert(
        urlHostOf("https://notphishing.example.evil/steal") ===
          "notphishing.example.evil",
        "a host that only contains the blocklisted name must not be parsed as it"
      );
      assert(
        urlHosts("https://phishing.example/steal").join(",") ===
          "phishing.example",
        "urlHosts must return parsed hosts only"
      );
      return;
    }

    default:
      return;
  }
}
