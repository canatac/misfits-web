import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "@/styles/globals.css";

export const dynamic = "force-dynamic";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
