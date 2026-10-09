import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext, type AuthLinkError } from "@/lib/auth-routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const OTP_TYPES: readonly EmailOtpType[] = ["signup", "email", "recovery", "email_change", "invite", "magiclink"];

/**
 * Landing route for links in Supabase emails (confirm sign-up, reset password).
 * Exchanges the one-time code or token for a session cookie, then redirects.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"), "/profile");
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const typeParam = searchParams.get("type");
  const type = OTP_TYPES.find((t) => t === typeParam) ?? null;

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
    // A fixed code, never free text: the login page only shows messages it knows.
    url.searchParams.set("error", (isReset ? "reset_invalid" : "link_invalid") satisfies AuthLinkError);
    return NextResponse.redirect(url);
  }
  return NextResponse.redirect(new URL(next, origin));
}
