import type { NextConfig } from "next";

// Workaround: bug di persistent cache di Turbopack (Next 16.2) che corrompe
// i file .sst e impedisce al dev server di servire le pagine.
// L'opzione funziona a runtime ma non è ancora nei tipi NextConfig.
const nextConfig = {
  turbopackFileSystemCacheForDev: false,
} satisfies NextConfig & Record<string, unknown>;

export default nextConfig;
