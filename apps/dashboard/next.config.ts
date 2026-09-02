import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Reserva espaco para o multipart; a validacao server-side limita o arquivo a 10 MiB.
      bodySizeLimit: "11mb",
    },
  },
  transpilePackages: ["@devora/ui"],
};

export default nextConfig;
