/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
  // Project-vanity domains: basewords.xyz / www.basewords.xyz forward to
  // cwoma.tools/basewords with the request path preserved. Requires
  // those domains to be attached to this project in "Connect to an
  // environment" mode (NOT "Redirect to Another Domain") — otherwise
  // Vercel's edge redirect runs first and these rules never see the
  // request.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: '(www\\.)?basewords\\.xyz',
          },
        ],
        destination: 'https://www.cwoma.tools/basewords/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
