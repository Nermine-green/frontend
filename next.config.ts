import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
       // Add other domains if you plan to use external images
       // {
       //   protocol: 'https',
       //   hostname: 'example.com',
       //   port: '',
       //   pathname: '/images/**',
       // },
    ],
  },
};

export default nextConfig;
