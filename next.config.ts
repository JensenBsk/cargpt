import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Next.js requires 'unsafe-inline' for its bootstrap scripts without a
// nonce-based setup; 'unsafe-eval' is only needed for dev tooling/HMR.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://cdn.onesignal.com https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  [
    "connect-src 'self'",
    "https://*.supabase.co wss://*.supabase.co",
    "https://vpic.nhtsa.dot.gov https://api.nhtsa.gov",
    "https://onesignal.com https://*.onesignal.com",
    "https://va.vercel-scripts.com https://vitals.vercel-insights.com",
    isDev ? "ws://localhost:* http://localhost:*" : "",
  ].filter(Boolean).join(" "),
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), geolocation=(), bluetooth=(self), payment=(), usb=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        // Immutable caching for static image assets in /public
        source: "/:file(.*\\.(?:png|jpg|jpeg|webp|avif|svg|ico))",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // iOS Universal Links requires JSON content type on the AASA file
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
    ];
  },
};

export default nextConfig;
