import path from "path";
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  outputFileTracingRoot: path.join(process.cwd()),
  // Keep this app's generated files isolated from stale dev servers.
  distDir: ".next-byce",
};
export default nextConfig;
