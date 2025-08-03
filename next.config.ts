import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "trae-api-us.mchost.guru",
        port: "",
        pathname: "/api/ide/v1/text_to_image**",
      },
      {
        protocol: "https",
        hostname: "rszqdjbjswwfparbzfyi.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        port: "",
        pathname: "/api/**",
      },
    ],
  },
};

export default nextConfig;
