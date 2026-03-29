import type { NextConfig } from "next";
import withSerwist from "@serwist/next";

const nextConfig: NextConfig = {
  turbopack: {},
  async redirects() {
    return [
      {
        source: "/",
        destination: "/pantry",
        permanent: false,
      },
    ];
  },
};

export default withSerwist({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
  register: true,
  reloadOnOnline: true,
  cacheOnNavigation: true,
})(nextConfig);
