"use client";

import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { useEffect, useState, type ReactNode } from "react";
import { toast, Toaster } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { ToastProvider } from "@/components/ui/toast-provider";
import { I18nProvider, useI18n } from "@/i18n/provider";
import { CommandPalette } from "@/components/command-palette";
import { useCommandPaletteKeyboard } from "@/hooks/use-command-palette";

function ProvidersContent({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  // Rehydrate the auth session from localStorage/cookies once on the client.
  // If an OAuth session was just consumed, show a welcome toast.
  useEffect(() => {
    void useAuthStore
      .getState()
      .hydrate()
      .then((result) => {
        if (result?.fromOAuth) {
          toast.success(t("toast.welcomeSignedIn"));
        }
      });
  }, [t]);

  useCommandPaletteKeyboard();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })}>
        <ToastProvider>
          <TooltipProvider delayDuration={300} skipDelayDuration={0}>
            {children}
          </TooltipProvider>
          <Toaster position="bottom-right" richColors />
        </ToastProvider>
      </QueryClientProvider>
      <CommandPalette />
    </ThemeProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <I18nProvider>
      <ProvidersContent children={children} />
    </I18nProvider>
  );
}