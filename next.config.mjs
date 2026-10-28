import { fileURLToPath } from "node:url";

const isDevelopment = process.env.NODE_ENV === "development";

/** @type {import("next").NextConfig} */
const nextConfig = {
  turbopack: { root: fileURLToPath(new URL(".", import.meta.url)) },
  async headers() {
    const adminHeaders = ["/admin/:path*", "/api/admin/:path*"].map((source) => ({
      source,
      headers: [
        { key: "Cache-Control", value: "private, no-store" },
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "X-Frame-Options", value: "DENY" },
      ],
    }));
    if (!isDevelopment) {
      return adminHeaders;
    }

    return [
      ...adminHeaders,
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self' ws: wss: http://localhost:* http://127.0.0.1:*",
              "frame-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
