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

  // Proxy vers le backend Rust (API Warp) sur smtp-vm
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_URL || "http://localhost:8080"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
