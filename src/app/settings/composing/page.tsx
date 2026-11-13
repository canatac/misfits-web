import { SendConfirmSettingsPanel } from "@/components/mail/composer/send-confirm-settings";

export const metadata = {
  title: "Composing — Settings",
};

export default function ComposingSettingsPage() {
  return (
    <div className="space-y-6">
      <SendConfirmSettingsPanel />
    </div>
  );
}
