import { withContentlayer } from "next-contentlayer2";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Contentlayer integrates via webpack; `next dev` (not turbopack) is used so
  // content is regenerated on change. See package.json scripts.
};

export default withContentlayer(nextConfig);
