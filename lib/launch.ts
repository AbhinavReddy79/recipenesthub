/**
 * Public launch: 20 October 2026, midnight India time.
 *
 * Until then everyone except the site owner (admins included) sees the
 * countdown at /coming-soon. The site opens by itself at this
 * moment; no redeploy is needed. To move the date, change it here and deploy.
 */
export const LAUNCH_AT = new Date("2026-10-20T00:00:00+05:30");

export const COMING_SOON_PATH = "/coming-soon";

export const isLaunched = (now = Date.now()) => now >= LAUNCH_AT.getTime();

/**
 * Pages anyone can still open before launch: the countdown, signing in (so
 * the owner can get in), password help, email-link landing pages, the legal
 * pages and the Razorpay webhook. Creating an account opens at launch.
 */
const PRE_LAUNCH_PATHS = [
  COMING_SOON_PATH,
  "/login",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/privacy",
  "/terms",
  "/api/billing/webhook",
];

export const isPreLaunchPath = (pathname: string) =>
  PRE_LAUNCH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
