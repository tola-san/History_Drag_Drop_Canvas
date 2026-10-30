import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/default-photos/[id]": ["./private/default-photos/*.jpg"],
  },

  async rewrites() {
    // Keep browser cookies on the frontend origin; Next forwards requests to Java.
    const backend = process.env.SPRING_BOOT_API_URL;
    if (!backend) return [];
    const origin = new URL(backend);
    if (
      origin.protocol !== "https:" &&
      !(
        origin.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(origin.hostname)
      )
    ) {
      throw new Error("SPRING_BOOT_API_URL must use HTTPS outside localhost.");
    }
    return [
      {
        source: "/api/auth/:path*",
        destination: `${backend.replace(/\/$/, "")}/auth/:path*`,
      },
    ];
  },
  turbopack: {
    rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } },
  },
};
export default nextConfig;
