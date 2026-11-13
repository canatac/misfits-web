//! Step implementations for the misfits-web Gherkin features.
//!
//! The harness loads each feature file and calls `execute_step` for every
//! step. A step of the form `the source file "<path>" is loaded` reads the
//! file from the repository root into the context; the other steps assert on
//! the loaded sources.

use std::collections::HashMap;
use std::path::PathBuf;

/// Context shared by the steps of a scenario.
pub struct Context {
    /// Source files loaded by the `the source file "..." is loaded` steps,
    /// keyed by the repository-relative path used in the feature file.
    pub values: HashMap<String, String>,
}

impl Context {
    pub fn new() -> Self {
        Self { values: HashMap::new() }
    }

    /// Content of a source file already loaded in the context.
    fn source(&self, path: &str) -> &str {
        self.values
            .get(path)
            .unwrap_or_else(|| panic!("source file not loaded: {path}"))
    }
}

impl Default for Context {
    fn default() -> Self {
        Self::new()
    }
}

/// Resolve a repository-relative path: try the working directory first (the
/// harness runs from the repository root), then walk up from this crate's
/// directory (tests/integration/gherkin) to the repository root.
fn read_source(rel: &str) -> String {
    if let Ok(content) = std::fs::read_to_string(rel) {
        return content;
    }
    let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    for ancestor in manifest.ancestors() {
        let candidate = ancestor.join(rel);
        if let Ok(content) = std::fs::read_to_string(&candidate) {
            return content;
        }
    }
    panic!("could not read source file: {rel}");
}

/// Steps for the send confirmation feature (issue #1059).
/// The behaviour lives in the Next.js client; these steps assert on the source.
fn execute_send_confirmation_step(step: &str, ctx: &mut Context) {
    if let Some(rel) = step.strip_prefix("the source file \"") {
        if let Some(rel) = rel.strip_suffix("\" is loaded") {
            let content = read_source(rel);
            ctx.values.insert(rel.to_string(), content);
        }
        return;
    }

    match step {
        "the composer asks for confirmation when the recipient count exceeds the threshold" => {
            let panel = ctx
                .values
                .get("src/components/mail/composer-panel.tsx")
                .expect("composer panel should be loaded");
            assert!(
                panel.contains("getRecipientThreshold()"),
                "the composer must read the configured threshold"
            );
            assert!(
                panel.contains("shouldSkipSendConfirm()"),
                "the composer must honour the skip preference"
            );
            assert!(
                panel.contains("setSendConfirmOpen(true)"),
                "the composer must open the confirmation modal above the threshold"
            );
            let modal = ctx
                .values
                .get("src/components/mail/composer/send-confirm-modal.tsx")
                .expect("send confirm modal should be loaded");
            assert!(
                modal.contains("DEFAULT_RECIPIENT_THRESHOLD"),
                "the default threshold must be defined"
            );
        }

        "the modal shows the To, Cc and Bcc recipients with the total count" => {
            let modal = ctx
                .values
                .get("src/components/mail/composer/send-confirm-modal.tsx")
                .expect("send confirm modal should be loaded");
            assert!(modal.contains("role=\"dialog\""), "the modal must be a dialog");
            assert!(modal.contains("To"), "the modal must list the To recipients");
            assert!(modal.contains("Cc"), "the modal must list the Cc recipients");
            assert!(modal.contains("Bcc"), "the modal must list the Bcc recipients");
            assert!(
                modal.contains("to.length + cc.length + bcc.length"),
                "the modal must compute the total recipient count"
            );
        }

        "the \"Don't ask again\" preference is persisted in localStorage" => {
            let modal = ctx
                .values
                .get("src/components/mail/composer/send-confirm-modal.tsx")
                .expect("send confirm modal should be loaded");
            assert!(
                modal.contains("SKIP_SEND_CONFIRM_KEY"),
                "the skip preference must have a localStorage key"
            );
            assert!(
                modal.contains("localStorage.setItem(SKIP_SEND_CONFIRM_KEY"),
                "the skip preference must be persisted in localStorage"
            );
            assert!(
                modal.contains("shouldSkipSendConfirm"),
                "the skip preference must be readable"
            );
        }

        "the footer shows the recipient count" => {
            let footer = ctx
                .values
                .get("src/components/mail/composer/composer-footer.tsx")
                .expect("composer footer should be loaded");
            assert!(
                footer.contains("recipientCount"),
                "the footer must receive the recipient count"
            );
            assert!(
                footer.contains("recipient-count"),
                "the footer must render the recipient count"
            );
        }

        "the Settings panel reads and writes the recipient threshold" => {
            let settings = ctx
                .values
                .get("src/components/mail/composer/send-confirm-settings.tsx")
                .expect("send confirm settings should be loaded");
            assert!(
                settings.contains("getRecipientThreshold()"),
                "the Settings panel must read the threshold"
            );
            assert!(
                settings.contains("setRecipientThreshold("),
                "the Settings panel must write the threshold"
            );
        }

        _ => {}
    }
}

pub fn execute_step(step: &str, ctx: &mut Context) {
    if let Some(rel) = step
        .strip_prefix("the source file \"")
        .and_then(|s| s.strip_suffix("\" is loaded"))
    {
        let content = read_source(rel);
        ctx.values.insert(rel.to_string(), content);
        return;
    }

    match step {
        // --- MW-2026-142: TOTP QR setup ---
        "the settings section shows a QR code for the authenticator app" => {
            let src = ctx.source("src/app/settings/security/_components/two-factor-section.tsx");
            assert!(src.contains("<img"), "the section must render the QR code image");
            assert!(src.contains("QR code"), "the QR image must be labelled for the authenticator app");
        }
        "the settings section shows the manual setup key" => {
            let src = ctx.source("src/app/settings/security/_components/two-factor-section.tsx");
            assert!(src.contains("Manual setup key"), "the manual setup key must be labelled");
            assert!(src.contains("two-factor-secret"), "the manual setup key input must be present");
        }

        // --- MW-2026-142: Activation with valid code and recovery codes ---
        "activating with a 6-digit code calls the activate function with that code" => {
            let test = ctx.source("src/app/settings/security/_components/__tests__/two-factor-section.test.tsx");
            assert!(test.contains("activate"), "the test must exercise the activate function");
            assert!(test.contains("123456"), "the test must submit a 6-digit code");
            assert!(test.contains("toHaveBeenCalledWith"), "the test must assert the activate call");
        }
        "a code shorter than 6 digits disables the enable button" => {
            let test = ctx.source("src/app/settings/security/_components/__tests__/two-factor-section.test.tsx");
            assert!(test.contains("code shorter than 6 digits"), "the test must cover a code shorter than 6 digits");
            assert!(test.contains("disabled"), "the test must assert the enable button is disabled");
        }
        "the section shows the recovery codes once 2FA is enabled" => {
            let src = ctx.source("src/app/settings/security/_components/two-factor-section.tsx");
            assert!(src.contains("Recovery codes"), "the section must show the recovery codes");
            assert!(src.contains("recoveryCodes"), "the section must read the recovery codes");
        }

        // --- MW-2026-142: Login requiring the 2FA code ---
        "the verification code input uses one-time-code autocomplete" => {
            let src = ctx.source("src/app/settings/security/_components/two-factor-section.tsx");
            assert!(src.contains("one-time-code"), "the code input must use one-time-code autocomplete");
        }
        "the verification code input requires exactly 6 digits" => {
            let src = ctx.source("src/app/settings/security/_components/two-factor-section.tsx");
            assert!(src.contains("maxLength={6}"), "the code input must be limited to 6 digits");
            assert!(src.contains("code.length !== 6"), "the code input must require exactly 6 digits");
        }

        // --- MW-2026-142: FIDO2/WebAuthn security key ---
        "the settings section offers a security key registration button" => {
            let src = ctx.source("src/app/settings/security/_components/two-factor-section.tsx");
            assert!(src.contains("Register security key"), "the section must offer a security key registration button");
        }
        "the security key registration calls navigator.credentials.create with a publicKey" => {
            let src = ctx.source("src/app/settings/security/_components/two-factor-section.tsx");
            assert!(src.contains("navigator.credentials.create"), "the registration must call navigator.credentials.create");
            assert!(src.contains("publicKey"), "the registration must pass a publicKey");
        }
        "the registered credential is sent to the registration finish endpoint" => {
            let src = ctx.source("src/app/settings/security/_components/two-factor-section.tsx");
            assert!(src.contains("/api/auth/webauthn/register/finish"), "the credential must be sent to the finish endpoint");
        }

        // --- MW-2026-142: New-login email notification ---
        "the 2FA status includes whether WebAuthn is enabled" => {
            let src = ctx.source("src/hooks/use-two-factor.ts");
            assert!(src.contains("webauthnEnabled"), "the status must include whether WebAuthn is enabled");
        }
        "the status request reports a failed request as an error" => {
            let src = ctx.source("src/hooks/use-two-factor.ts");
            assert!(src.contains("throw new Error"), "a failed request must raise an error");
            assert!(src.contains("setError"), "the error must be surfaced to the section");
        }

        // --- MW-2026-142: 2FA deactivation ---
        "the enabled section shows a disable button" => {
            let src = ctx.source("src/app/settings/security/_components/two-factor-section.tsx");
            assert!(src.contains("Disable two-factor authentication"), "the enabled section must show a disable button");
        }
        "clicking disable calls the deactivate function" => {
            let src = ctx.source("src/app/settings/security/_components/two-factor-section.tsx");
            assert!(src.contains("deactivate()"), "clicking disable must call deactivate");
        }

        // --- MW-2026-142: Recovery codes at login ---
        "the recovery codes are shown with the warning that each code can be used once" => {
            let src = ctx.source("src/app/settings/security/_components/two-factor-section.tsx");
            assert!(src.contains("Each code can be used once"), "the recovery codes must carry the single-use warning");
        }

        // --- Issue #1059: send confirmation for large recipient lists ---
        "the composer asks for confirmation when the recipient count exceeds the threshold"
        | "the modal shows the To, Cc and Bcc recipients with the total count"
        | "the \"Don't ask again\" preference is persisted in localStorage"
        | "the footer shows the recipient count"
        | "the Settings panel reads and writes the recipient threshold" => {
            execute_send_confirmation_step(step, ctx);
        }

        // Steps of the other features are out of scope for this change.
        _ => {}
    }
}
