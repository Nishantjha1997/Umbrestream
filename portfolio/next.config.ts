import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.nishant.top" }],
        destination: "https://nishant.top/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
