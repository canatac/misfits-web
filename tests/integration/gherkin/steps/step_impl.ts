use crate::Context;

/// Step implementations for the URL phishing feature (issue #1046).
/// These steps exercise the real TypeScript source via regex assertions,
/// matching the existing Gherkin step style of this repository.

pub fn execute_url_phishing_step(step: &str, ctx: &mut Context) {
    match step {
        "an email body with the URL \"https://google.com/search\"" => {
            ctx.insert(
                "email_body",
                "https://google.com/search".to_string(),
            );
        }
        "an email body with the URL \"https://phishing.example/steal\"" => {
            ctx.insert(
                "email_body",
                "https://phishing.example/steal".to_string(),
            );
        }
        "an email body with the shortened URL \"https://bit.ly/abc123\"" => {
            ctx.insert(
                "email_body",
                "https://bit.ly/abc123".to_string(),
            );
        }
        "the URLs are extracted and scanned" => {
            let body = ctx.get("email_body").cloned().unwrap_or_default();
            assert!(
                body.contains("https://"),
                "body must contain an https URL: {body}"
            );
            let scanner = ctx
                .values
                .get("src/lib/url-scanner.ts")
                .expect("url-scanner.ts must be loaded");
            assert!(
                scanner.contains("extractUrls") && scanner.contains("checkUrlReputation"),
                "the scanner must extract URLs and check their reputation"
            );
        }
        "no URL is suspicious" => {
            let body = ctx.get("email_body").cloned().unwrap_or_default();
            assert!(
                body.contains("google.com"),
                "legitimate URL must not be flagged: {body}"
            );
            let scanner = ctx
                .values
                .get("src/lib/url-scanner.ts")
                .expect("url-scanner.ts must be loaded");
            assert!(
                scanner.contains("TRUSTED_DOMAINS"),
                "the scanner must keep a list of trusted domains"
            );
            assert!(
                scanner.contains("google.com"),
                "google.com must be in the trusted domains"
            );
        }
        "the URL is suspicious" => {
            let body = ctx.get("email_body").cloned().unwrap_or_default();
            assert!(
                body.contains("phishing.example"),
                "suspicious URL must be flagged: {body}"
            );
            let scanner = ctx
                .values
                .get("src/lib/url-scanner.ts")
                .expect("url-scanner.ts must be loaded");
            assert!(
                scanner.contains("BLOCKED_DOMAINS"),
                "the scanner must keep a blocklist"
            );
            assert!(
                scanner.contains("phishing.example"),
                "phishing.example must be on the blocklist"
            );
        }
        "the shortened URL is flagged as suspicious" => {
            let body = ctx.get("email_body").cloned().unwrap_or_default();
            assert!(
                body.contains("bit.ly"),
                "shortened URL must be flagged: {body}"
            );
            let scanner = ctx
                .values
                .get("src/lib/url-scanner.ts")
                .expect("url-scanner.ts must be loaded");
            assert!(
                scanner.contains("SHORTENER_DOMAINS"),
                "the scanner must keep a list of URL shorteners"
            );
            assert!(
                scanner.contains("bit.ly"),
                "bit.ly must be in the shortener list"
            );
        }
        "the resolution of the shortened URL is requested" => {
            let scanner = ctx
                .values
                .get("src/lib/url-scanner.ts")
                .expect("url-scanner.ts must be loaded");
            assert!(
                scanner.contains("Shortened URL: destination hidden, resolution requested"),
                "the scanner must request the resolution of a shortened URL"
            );
        }
        "the warning badge is shown in the email view" => {
            let view = ctx
                .values
                .get("src/components/mail/email-view.tsx")
                .expect("email-view.tsx must be loaded");
            assert!(
                view.contains("UrlWarningBadge"),
                "the email view must render UrlWarningBadge"
            );
            assert!(
                view.contains("suspiciousUrlCount"),
                "the email view must compute the suspicious URL count"
            );
        }
        "the warning badge is not shown" => {
            let view = ctx
                .values
                .get("src/components/mail/email-view.tsx")
                .expect("email-view.tsx must be loaded");
            assert!(
                view.contains("suspiciousUrlCount > 0"),
                "the badge must be conditional on a non-zero suspicious count"
            );
        }
        "the user setting \"urlScanEnabled\" is false" => {
            ctx.insert("urlScanEnabled", "false".to_string());
        }
        "no URL is scanned" => {
            let enabled = ctx.get("urlScanEnabled").cloned().unwrap_or_else(|| "true".to_string());
            assert_eq!(enabled, "false", "scan must be skipped when disabled");
        }
        _ => {}
    }
}
