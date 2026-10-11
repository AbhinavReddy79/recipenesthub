/**
 * Public launch: planned for 20 October 2026, midnight India time.
 *
 * The site opens only when the owner presses "Launch RecipeNest" in the admin
 * dashboard (stored in the database, see site_is_launched). Until then
 * everyone except the owner and people they give early access sees the
 * countdown at /coming-soon. This date is only what the countdown shows.
 */
export const LAUNCH_AT = new Date("2026-10-20T00:00:00+05:30");

export const COMING_SOON_PATH = "/coming-soon";

/**
 * Pages anyone can still open before launch: only the countdown and what the
 * owner and early-access members need to get in (sign in, password help,
 * email-link landing pages). Everything else, including Premium, Terms,
 * Privacy and Contact, opens at launch.
 */
const PRE_LAUNCH_PATHS = [
  COMING_SOON_PATH,
  "/login",
  "/forgot-password",
  "/reset-password",
  "/auth",
];

export const isPreLaunchPath = (pathname: string) =>
  PRE_LAUNCH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
