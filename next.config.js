/** @type {import('next').NextConfig} */
const nextConfig = {
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
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'drive.google.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["@genkit-ai/googleai"],
    // This is the fix: Ignore the AI directory from the Next.js watcher
    // to prevent restart loops with the Genkit watcher.
    outputFileTracingExcludes: {
      "**/*": [
        "./src/ai/**/*"
      ]
    }
  },
};

module.exports = nextConfig;
