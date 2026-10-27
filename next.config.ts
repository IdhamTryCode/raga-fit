import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App memakai sesi Supabase di setiap layar (cookies + getUser),
  // jadi model prerender Cache Components tidak cocok untuk MVP ini.
  cacheComponents: false,
};

export default nextConfig;
