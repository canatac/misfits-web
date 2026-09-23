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
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },

  // Proxy vers email_api HTTP — rewrites are baked at build time.
  // Prefer build-arg BACKEND_URL=http://email-api:8000 in Docker image builds.
  //
  // Uses afterFiles so Next.js route handlers (e.g. /api/compose/send/route.ts,
  // /api/health/route.ts) take precedence over the backend proxy rewrite.
  //
  // Without afterFiles, the rewrite fires BEFORE route handlers and forwards
  // /api/compose/send → backend /api/compose/send (doesn't exist → 404, issue #793)
  // and /api/health → backend /api/health (doesn't exist → 404, issue #887/#891).
  //
  // With afterFiles, route handlers match first:
  //   - /api/compose/send/route.ts transforms path → /api/send + auth forwarding
  //   - /api/health/route.ts probes backend mongo-health for Docker healthcheck
  //   - All other /api/* paths fall through to the rewrite → backend normally
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL ||
      (process.env.NODE_ENV === "production"
        ? "http://email-api:8000"
        : "http://localhost:8000");
    return {
      afterFiles: [
        {
          source: "/api/:path*",
          destination: `${backendUrl}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
