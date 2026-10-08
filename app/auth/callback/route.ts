import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth-routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Landing route for links in Supabase emails (confirm sign-up, reset password).
 * Exchanges the one-time code or token for a session cookie, then redirects.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"), "/profile");
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createSupabaseServerClient();
  let error: { message: string } | null = null;

  const isReset = type === "recovery" || next === "/reset-password";

  if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash }));
  } else if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
    // Supabase only sends a code after it has verified the email link, so the
    // address is confirmed even when the exchange fails (it needs the browser
    // that started sign-up, e.g. not a phone's mail app). They can just log in.
    if (error && !isReset) {
      console.warn("auth callback: code exchange failed after confirmation:", error.message);
      return NextResponse.redirect(new URL("/login?confirmed=1", origin));
    }
  } else {
    error = { message: "This link is missing its sign-in code." };
  }

  if (error) {
    console.error("auth callback failed:", error.message);
    const url = new URL("/login", origin);
    url.searchParams.set(
      "error",
      isReset
        ? "This password reset link is invalid or has expired, or was opened in a different browser. Choose “Forgot password?” to get a new one."
        : "This link is invalid or has expired. Log in, or create your account again to get a new link.",
    );
    return NextResponse.redirect(url);
  }
  return NextResponse.redirect(new URL(next, origin));
}
