/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone pour Docker (optimisé pour les conteneurs)
  output: "standalone",

  // Sécurité
  poweredByHeader: false,
  reactStrictMode: true,

  // Images — domains autorisés
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.misfits.ai",
      },
    ],
  },

  // Headers de sécurité
  async headers() {
    return [
      {
        source: "/",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },

  // Proxy vers email_api HTTP — rewrites are baked at build time.
  // Prefer build-arg BACKEND_URL=http://email-api:8000 in Docker image builds.
  //
  // /api/compose/* is excluded from the generic rewrite (identity pass-through)
  // because it has its own route handler (src/app/api/compose/send/route.ts)
  // that proxies to /api/send on the backend with auth forwarding. Without
  // this exclusion, the rewrite forwards /api/compose/send to the backend's
  // /api/compose/send which doesn't exist → 404 (issue #793).
  //
  // /api/health is excluded because it has its own local route handler
  // (src/app/api/health/route.ts) that probes backend connectivity for
  // Docker healthcheck. Without this exclusion, the rewrite proxies
  // /api/health to the backend which has no such endpoint → 404 (issue #887).
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL ||
      (process.env.NODE_ENV === "production"
        ? "http://email-api:8000"
        : "http://localhost:8000");
    return [
      {
        source: "/api/compose/:path*",
        destination: "/api/compose/:path*",
      },
      {
        source: "/api/health",
        destination: "/api/health",
      },
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
