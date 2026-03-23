import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ["essentia.js"],
  // essentia.js must NOT appear here if it is in transpilePackages (Next.js forbids overlap).
  serverExternalPackages: [
    "@distube/ytdl-core",
    "fluent-ffmpeg",
    "ffmpeg-static",
    "youtube-sr",
  ],
};

export default nextConfig;
