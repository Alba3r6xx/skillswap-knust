import type { NextConfig } from "next";

const securityHeaders = [
  // Deny framing from other origins — clickjacking protection
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limit referrer info to same-origin
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable unnecessary browser features
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=(), payment=(), usb=()",
  },
  // HSTS — enforce HTTPS for 1 year (enable in production after confirming HTTPS)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  // Content Security Policy — tight but functional for Supabase + Next.js
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts: self + Next.js eval for dev HMR
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      // Styles: self + inline (Tailwind injects inline styles in dev)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com data:",
      // Images: self + Supabase storage + data URIs + blob (for avatar uploads)
      "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://images.unsplash.com",
      // Connections: self + Supabase API + WebSockets
      "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in",
      // Media: self + blob (voice notes, audio)
      "media-src 'self' blob:",
      // Workers: blob (for audio worklets)
      "worker-src 'self' blob:",
      // Frames: none
      "frame-ancestors 'self'",
      // Forms only submit to self
      "form-action 'self'",
      // Upgrade insecure requests
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // Prevent leaking server info
  poweredByHeader: false,
};

export default nextConfig;
