"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AuthLinkError } from "@/lib/auth-routes";

/**
 * Supabase sends people from email links to the page the app asked for, but
 * falls back to the home page when the link was requested from another address
 * (a preview deployment, localhost…). Home then redirects signed-out visitors
 * to /login, so the link's details end up in the URL fragment there. This
 * forwards them to where they belong instead of silently dropping them.
 */
export function EmailLinkHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash || pathname === "/reset-password") return;
    const params = new URLSearchParams(hash);

    // A password-reset or invite link: finish it on the password page (keeps the fragment).
    if ((params.get("type") === "recovery" || params.get("type") === "invite") && params.has("access_token")) {
      router.replace(`/reset-password#${hash}`);
      return;
    }

    // An expired or already-used email link.
    if (params.has("error_code") || params.has("error_description")) {
      router.replace(`/login?error=${"link_invalid" satisfies AuthLinkError}`);
    }
  }, [pathname, router]);

  return null;
}
