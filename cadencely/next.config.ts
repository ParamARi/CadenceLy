import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ["essentia.js"],
  serverExternalPackages: [
    "essentia.js",
    "@distube/ytdl-core",
    "fluent-ffmpeg",
    "ffmpeg-static",
    "youtube-sr",
  ],
};

export default nextConfig;
