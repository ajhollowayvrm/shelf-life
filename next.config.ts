import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import withSerwist from "@serwist/next";

const nextConfig: NextConfig = {
  turbopack: {},
};

const withPWA = withSerwist({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
  register: true,
  reloadOnOnline: true,
  cacheOnNavigation: true,
});

export default withSentryConfig(withPWA(nextConfig), {
  silent: true,
  disableLogger: true,
});
