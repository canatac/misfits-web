import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "misfits.ai Mail",
  description: "IA-first email client — privacy-first, built for speed",
  metadataBase: new URL("https://mail.misfits.ai"),
  openGraph: {
    title: "misfits.ai Mail",
    description: "IA-first email client — privacy-first, built for speed",
    url: "https://mail.misfits.ai",
    siteName: "misfits.ai Mail",
  },
};

function resolveBuildVersion(value: string | undefined, fallback = "unknown") {
  if (!value) return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const misfitsWebBuild = resolveBuildVersion(
    process.env.NEXT_PUBLIC_MISFITS_WEB_BUILD_VERSION ||
      process.env.MISFITS_WEB_BUILD_VERSION ||
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  );

  const reimaginedGuideBuild = resolveBuildVersion(
    process.env.NEXT_PUBLIC_REIMAGINED_GUIDE_BUILD_VERSION ||
      process.env.REIMAGINED_GUIDE_BUILD_VERSION,
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="pb-6">
        <Providers>{children}</Providers>

        <footer className="fixed inset-x-0 bottom-0 z-[70] border-t border-[var(--color-border)] bg-[var(--color-bg)]/95 px-3 py-1 text-center text-[11px] text-[var(--color-muted-fg)] backdrop-blur">
          <span className="font-medium">Build</span>
          <span className="mx-2">misfits-web: {misfitsWebBuild}</span>
          <span className="opacity-60">|</span>
          <span className="mx-2">reimagined-guide: {reimaginedGuideBuild}</span>
        </footer>
      </body>
    </html>
  );
}
