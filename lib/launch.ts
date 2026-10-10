/**
 * Public launch: 20 October 2026, midnight India time.
 *
 * Until then everyone except admins (you, the owner, and anyone you make an
 * admin) sees the countdown at /coming-soon. The site opens by itself at this
 * moment; no redeploy is needed. To move the date, change it here and deploy.
 */
export const LAUNCH_AT = new Date("2026-10-20T00:00:00+05:30");

export const COMING_SOON_PATH = "/coming-soon";

export const isLaunched = (now = Date.now()) => now >= LAUNCH_AT.getTime();

/**
 * Pages anyone can still open before launch: the countdown, signing in (so
 * admins can get in), password help, email-link landing pages and the legal
 * pages. Creating an account opens at launch.
 */
const PRE_LAUNCH_PATHS = [COMING_SOON_PATH, "/login", "/forgot-password", "/reset-password", "/auth", "/privacy", "/terms"];

export const isPreLaunchPath = (pathname: string) =>
  PRE_LAUNCH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
