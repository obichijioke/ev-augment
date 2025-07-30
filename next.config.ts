import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'trae-api-us.mchost.guru',
        port: '',
        pathname: '/api/ide/v1/text_to_image**',
      },
    ],
  },
};

export default nextConfig;
