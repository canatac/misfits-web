"use client";

import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { useEffect, useState, type ReactNode } from "react";
import { toast, Toaster } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { I18nProvider } from "@/i18n/provider";

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

  // Rehydrate the auth session from localStorage/cookies once on the client.
  // If an OAuth session was just consumed, show a welcome toast.
  useEffect(() => {
    const result = useAuthStore.getState().hydrate();
    if (result?.fromOAuth) {
      toast.success("Welcome! Signed in successfully.");
    }
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <TooltipProvider delayDuration={300} skipDelayDuration={0}>
            {children}
          </TooltipProvider>
          <Toaster position="bottom-right" richColors />
        </I18nProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
