"use client";

import { useEffect, type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { AuthDialogProvider } from "@/components/auth/auth-dialog";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { startSync } from "@/lib/storage/sync";

export function Providers({ children }: { children: ReactNode }) {
  // Follow Supabase Auth: load the signed-in user's data, clear it on sign-out.
  useEffect(() => startSync(), []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <TooltipProvider delayDuration={300}>
        <AuthDialogProvider>
          {children}
          <Toaster position="bottom-center" mobileOffset={{ bottom: "calc(5.75rem + env(safe-area-inset-bottom))" }} />
        </AuthDialogProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
