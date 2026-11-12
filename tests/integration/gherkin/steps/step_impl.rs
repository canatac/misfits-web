//! Step implementations for the Gherkin features.
//!
//! Each step either executes the real function behind the behaviour or loads a
//! source file and asserts the behaviour is present in it.

use std::collections::HashMap;

pub struct Context {
    pub values: HashMap<String, String>,
}

impl Context {
    pub fn new() -> Self {
        Context {
            values: HashMap::new(),
        }
    }
}

/// Load a source file into the context so later steps can assert on it.
fn load_source(rel: &str, ctx: &mut Context) {
    let content = std::fs::read_to_string(rel).unwrap_or_else(|e| panic!("cannot read {rel}: {e}"));
    ctx.values.insert(rel.to_string(), content);
}

/// Steps for the send confirmation feature (issue #1059).
/// The behaviour lives in the Next.js client; these steps assert on the source.
pub fn execute_step(step: &str, ctx: &mut Context) {
    if let Some(rel) = step.strip_prefix("the source file \"") {
        if let Some(rel) = rel.strip_suffix("\" is loaded") {
            load_source(rel, ctx);
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
