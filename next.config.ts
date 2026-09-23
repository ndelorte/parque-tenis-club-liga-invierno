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
      {
        source: "/mid-master",
        destination: "/circuito-del-parque/especiales/mid-master-2026",
        permanent: true,
      },
      {
        source: "/mid-master/categorias/:slug",
        destination: "/circuito-del-parque/especiales/mid-master-2026/categorias/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
