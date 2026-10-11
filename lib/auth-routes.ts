/**
 * RecipeNest is members-only: every page needs an account except these.
 * (Email-link landing pages, the legal, Premium and contact pages and the
 * welcome page stay open to everyone.)
 */
export const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/privacy",
  "/terms",
  "/contact",
  "/pricing",
  "/welcome",
] as const;

/** Pages where a signed-in visitor has nothing to do (sent home instead). */
export const GUEST_ONLY_PATHS = ["/login", "/register"] as const;

const matches = (pathname: string, paths: readonly string[]) =>
  paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

export const isPublicPath = (pathname: string) => matches(pathname, PUBLIC_PATHS);
export const isGuestOnlyPath = (pathname: string) => matches(pathname, GUEST_ONLY_PATHS);

/** Control characters (which browsers strip from URLs) and backslashes (which they treat as "/"). */
const UNSAFE_URL_CHARS = /[\u0000-\u001f\u007f\\]/;

/**
 * Only same-site paths are allowed as a post-login destination. The value is
 * resolved the way a browser would, so tricks such as "/%09/evil.com" or
 * "/\evil.com" can't send people to another site.
 */
export function safeNext(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/") || value.length > 512 || UNSAFE_URL_CHARS.test(value)) return fallback;
  try {
    const base = "https://recipenest.invalid";
    const url = new URL(value, base);
    // "/..//evil.com" resolves to the path "//evil.com", which a browser reads as another site.
    if (url.origin !== base || url.pathname.startsWith("//")) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

/** Messages the login page may show after an email link; anything else in the URL is ignored. */
export const AUTH_LINK_ERRORS = {
  link_invalid: "This link is invalid or has expired. Log in, or create your account again to get a new link.",
  reset_invalid: "This password reset link is invalid or has expired. Choose “Forgot password?” to get a new one.",
} as const;

export type AuthLinkError = keyof typeof AUTH_LINK_ERRORS;

export const authLinkError = (code: unknown): string | undefined =>
  typeof code === "string" && Object.hasOwn(AUTH_LINK_ERRORS, code) ? AUTH_LINK_ERRORS[code as AuthLinkError] : undefined;
