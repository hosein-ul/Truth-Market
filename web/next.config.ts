import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  // The Node build of the Zama relayer SDK is dynamically imported by
  // markets.ts in RSC. Mark it as a server-external so Next leaves it alone
  // instead of bundling its native/WASM pieces.
  serverExternalPackages: ["@zama-fhe/relayer-sdk"],
  // Zama relayer-sdk uses WebAssembly + Web Workers; SharedArrayBuffer needs
  // these headers cross-origin. Required even for `next dev`.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
  webpack: (config) => {
    // The relayer-sdk WASM lives inside the package; we serve it as-is.
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};

export default nextConfig;
