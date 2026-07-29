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

  // Proxy vers le backend Rust (IMAP API Warp) — en production via Docker network, en dev via localhost
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL ||
      (process.env.NODE_ENV === "production"
        ? "http://imap-server:8080"
        : "http://localhost:8080");
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
