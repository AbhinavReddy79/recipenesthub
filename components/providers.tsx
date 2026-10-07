"use client";

import { useEffect, type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { AuthDialogProvider } from "@/components/auth/auth-dialog";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { accountsStorage } from "@/lib/storage/accounts";

export function Providers({ children }: { children: ReactNode }) {
  // End "don't remember me" sessions left over from a previous browser session.
  useEffect(() => accountsStorage.expireIfNeeded(), []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <TooltipProvider delayDuration={300}>
        <AuthDialogProvider>
          {children}
          <Toaster position="bottom-center" mobileOffset={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }} />
        </AuthDialogProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
