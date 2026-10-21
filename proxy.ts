import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { isGuestOnlyPath, isPublicPath, safeNext } from "@/lib/auth-routes";
import { COMING_SOON_PATH, LAUNCH_AT, isPreLaunchPath } from "@/lib/launch";

/** What signed-out visitors see at the site's address after launch. */
const WELCOME_PATH = "/welcome";

/** Supabase's public JWT signing key (from /auth/v1/.well-known/jwks.json; public by design). */
const SIGNING_KEYS = {
  keys: [
    {
      alg: "ES256",
      crv: "P-256",
      ext: true,
      key_ops: ["verify"],
      kid: "3daa9113-3094-4822-9fc0-0a64c98e2130",
      kty: "EC",
      use: "sig",
      x: "19xe7UcVnTIyTE8wx2VWPq7smrveC5ZxtXUroJI8LhM",
      y: "XQH-w-tOXTDf44uIQHnWCFsVuTyGAKqtVxbBGmD54EI",
    },
  ],
};
import type { Database } from "@/lib/supabase/database.types";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "@/lib/supabase/env";

/**
 * Keeps the Supabase session fresh (refreshes an expiring access token and
 * writes the updated auth cookies onto the response) and makes the site
 * members-only: visitors without an account are sent to /login first.
 * Before launch, only the site owner and people with early access get past the countdown page.
 */
export async function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!isSupabaseConfigured) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Validates the token and triggers a refresh when needed. The project's public
  // signing key is supplied so a fresh server needn't fetch it first (a rotated
  // key isn't in this list, and is then fetched as usual).
  const { data } = await supabase.auth.getClaims(undefined, { jwks: SIGNING_KEYS });
  const signedIn = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  // Before launch: the site is open only to the owner and people they gave
  // early access; everyone else (admins included) sees the countdown. After launch the countdown page just leads home.
  // The site's address itself always shows a page (the countdown, or the welcome
  // page for signed-out visitors after launch) rather than redirecting, so it
  // can be shared and verified as a working website.
  if (!(await siteLaunched(supabase, event))) {
    if (!isPreLaunchPath(pathname) && !(signedIn && (await hasSiteAccess(supabase)))) {
      if (pathname === "/") return rewriteKeepingCookies(new URL(COMING_SOON_PATH, request.url), request, response);
      return redirectKeepingCookies(new URL(COMING_SOON_PATH, request.url), response);
    }
  } else if (pathname === COMING_SOON_PATH) {
    return redirectKeepingCookies(new URL("/", request.url), response);
  }

  if (!signedIn && pathname === "/") {
    return rewriteKeepingCookies(new URL(WELCOME_PATH, request.url), request, response);
  }

  if (!signedIn && !isPublicPath(pathname) && pathname !== COMING_SOON_PATH) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", `${pathname}${search}`);
    return redirectKeepingCookies(url, response);
  }

  // The admin console is for active admins only. (The database enforces this
  // for every admin action too; this keeps the pages themselves private.)
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!(await isActiveAdmin(supabase, data?.claims?.sub))) {
      return redirectKeepingCookies(new URL("/", request.url), response);
    }
  }

  if (signedIn && isGuestOnlyPath(pathname)) {
    const next = safeNext(request.nextUrl.searchParams.get("next"));
    return redirectKeepingCookies(new URL(next, request.url), response);
  }

  return response;
}

// Whether the owner has launched the site, remembered per server instance.
// Pages never wait on the database for it once an answer is known (or, after
// the launch date, on a fresh instance): the answer is refreshed in the
// background, so "Undo launch" still takes effect within about a minute.
const LAUNCH_CACHE_MS = 60_000;
let launchCache: { value: boolean; at: number } | null = null;
let launchRefresh: Promise<boolean> | null = null;

function refreshLaunched(supabase: ReturnType<typeof createServerClient<Database>>): Promise<boolean> {
  launchRefresh ??= Promise.resolve(supabase.rpc("site_is_launched"))
    .then(({ data, error }) => {
      // If the database can't be reached, keep the last known answer.
      if (error) return launchCache?.value ?? Date.now() >= LAUNCH_AT.getTime();
      launchCache = { value: data === true, at: Date.now() };
      return launchCache.value;
    })
    .finally(() => {
      launchRefresh = null;
    });
  return launchRefresh;
}

async function siteLaunched(supabase: ReturnType<typeof createServerClient<Database>>, event: NextFetchEvent): Promise<boolean> {
  const known = launchCache?.value ?? (Date.now() >= LAUNCH_AT.getTime() ? true : null);
  if (known === null) return refreshLaunched(supabase);
  if (!launchCache || Date.now() - launchCache.at >= LAUNCH_CACHE_MS) event.waitUntil(refreshLaunched(supabase));
  return known;
}

/** The signed-in user may use the site before launch: the owner, or someone they gave early access (checked in the database). */
async function hasSiteAccess(supabase: ReturnType<typeof createServerClient<Database>>): Promise<boolean> {
  const { data } = await supabase.rpc("has_site_access");
  return data === true;
}

async function isActiveAdmin(supabase: ReturnType<typeof createServerClient<Database>>, userId: unknown): Promise<boolean> {
  if (typeof userId !== "string" || !userId) return false;
  const { data: profile } = await supabase.from("profiles").select("role, status").eq("id", userId).maybeSingle();
  return profile?.role === "admin" && profile.status === "active";
}

/** Shows another page at the same address while carrying over any refreshed auth cookies. */
function rewriteKeepingCookies(url: URL, request: NextRequest, from: NextResponse): NextResponse {
  const rewrite = NextResponse.rewrite(url, { request });
  from.cookies.getAll().forEach((cookie) => rewrite.cookies.set(cookie));
  return rewrite;
}

/** Redirects while carrying over any refreshed auth cookies. */
function redirectKeepingCookies(url: URL, from: NextResponse): NextResponse {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  from.headers.forEach((value, key) => {
    if (key.toLowerCase() === "cache-control") redirect.headers.set(key, value);
  });
  return redirect;
}

export const config = {
  matcher: [
    // Everything except static assets, optimised images and metadata files.
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};
