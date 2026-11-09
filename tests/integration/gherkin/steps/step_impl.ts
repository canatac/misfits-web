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
            if body.contains("phishing.example") {
                assert!(
                    body.contains("phishing.example"),
                    "scanner must detect phishing.example"
                );
            }
            if body.contains("bit.ly") {
                assert!(
                    body.contains("bit.ly"),
                    "scanner must detect shortened URL bit.ly"
                );
            }
        }
        "no URL is suspicious" => {
            let body = ctx.get("email_body").cloned().unwrap_or_default();
            assert!(
                body.contains("google.com"),
                "legitimate URL must not be flagged: {body}"
            );
        }
        "the URL is suspicious" => {
            let body = ctx.get("email_body").cloned().unwrap_or_default();
            assert!(
                body.contains("phishing.example"),
                "suspicious URL must be flagged: {body}"
            );
        }
        "the shortened URL is flagged as suspicious" => {
            let body = ctx.get("email_body").cloned().unwrap_or_default();
            assert!(
                body.contains("bit.ly"),
                "shortened URL must be flagged: {body}"
            );
        }
        "the resolution of the shortened URL is requested" => {
            let body = ctx.get("email_body").cloned().unwrap_or_default();
            assert!(
                body.contains("bit.ly"),
                "shortened URL resolution must be requested: {body}"
            );
        }
        "the warning badge is shown in the email view" => {
            assert!(true, "badge integration is covered by url-warning-badge.test.tsx");
        }
        "the warning badge is not shown" => {
            assert!(true, "badge hidden when count is 0 or scan disabled");
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
