import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/liga-invierno",
        destination: "/ligas-invierno-verano",
        permanent: true,
      },
      {
        source: "/liga-invierno/:path*",
        destination: "/ligas-invierno-verano/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
