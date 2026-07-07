import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  // The Node build of the Zama relayer SDK is dynamically imported by
  // markets.ts in RSC. Mark it as a server-external so Next leaves it alone
  // instead of bundling its native/WASM pieces.
  serverExternalPackages: ["@zama-fhe/relayer-sdk"],
  webpack: (config, { isServer }) => {
    // The relayer-sdk WASM lives inside the package; we serve it as-is.
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        "pino-pretty": false,
        "@react-native-async-storage/async-storage": false,
      };
    }
    config.externals.push("pino-pretty", "lokijs", "encoding");
    
    return config;
  },
};

export default nextConfig;
