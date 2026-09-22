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
  // Uses afterFiles so Next.js route handlers (e.g. /api/compose/send/route.ts)
  // take precedence. Without this, the rewrite fires first and forwards
  // /api/compose/send to the backend which has no such endpoint → 404 (issue #793).
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
