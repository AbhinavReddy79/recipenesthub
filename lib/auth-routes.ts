/**
 * RecipeNest is members-only: every page needs an account except these.
 * (Email-link landing pages and the legal pages stay open to everyone.)
 */
export const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/auth", "/privacy", "/terms"] as const;

/** Pages where a signed-in visitor has nothing to do (sent home instead). */
export const GUEST_ONLY_PATHS = ["/login", "/register"] as const;

const matches = (pathname: string, paths: readonly string[]) =>
  paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

export const isPublicPath = (pathname: string) => matches(pathname, PUBLIC_PATHS);
export const isGuestOnlyPath = (pathname: string) => matches(pathname, GUEST_ONLY_PATHS);

/** Only same-site relative paths are allowed as a post-login destination. */
export function safeNext(value: string | null | undefined, fallback = "/"): string {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : fallback;
}
