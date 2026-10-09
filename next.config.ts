import type { NextConfig } from "next";

/** Public Supabase Storage (avatars, recipe photos); also covers a custom Supabase domain. */
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
})();

const isProduction = process.env.NODE_ENV === "production";
const supabaseOrigins = ["https://*.supabase.co", ...(supabaseHost && !supabaseHost.endsWith(".supabase.co") ? [`https://${supabaseHost}`] : [])];

/**
 * Content Security Policy. Scripts may only come from this site (Next.js needs
 * inline scripts for hydration), data may only be sent to this site and
 * Supabase, and images only from the sources the app uses. Development keeps
 * a relaxed policy because hot reload needs eval and websockets.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://images.unsplash.com https://www.themealdb.com https://upload.wikimedia.org https://thumb.wikimedia.org ${supabaseOrigins.join(" ")}`,
  "font-src 'self' data:",
  `connect-src 'self' data: blob: ${supabaseOrigins.join(" ")} ${supabaseOrigins.map((o) => o.replace("https://", "wss://")).join(" ")}${isProduction ? "" : " ws: http://localhost:*"}`,
  "media-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

/** Standard protective headers for every response. */
const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.themealdb.com",
        pathname: "/images/ingredients/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/commons/**",
      },
      {
        protocol: "https",
        hostname: "thumb.wikimedia.org",
        pathname: "/wikipedia/commons/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      ...(supabaseHost && !supabaseHost.endsWith(".supabase.co")
        ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
        : []),
    ],
    qualities: [70, 75, 85],
  },
};

export default nextConfig;
