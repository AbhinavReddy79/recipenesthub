"use client";

import ReactDOM from "react-dom";

/**
 * Opens the connection to Supabase while the page is still loading, so the first
 * sign-in check and data request don't wait for DNS + TLS (~300 ms on mobile).
 * supabase-js fetches without cookies, hence an anonymous (CORS) connection.
 */
export function PreconnectSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (url) ReactDOM.preconnect(url, { crossOrigin: "anonymous" });
  return null;
}
