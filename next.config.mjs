/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Enable experimental features for better performance
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
}

export default nextConfig
