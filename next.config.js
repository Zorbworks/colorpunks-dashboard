/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // @resvg/resvg-js ships native bindings that webpack cannot bundle.
  // Listing it here tells Next to load it via runtime require() in the
  // server bundle instead of trying to parse the .node file.
  experimental: {
    serverComponentsExternalPackages: ['@resvg/resvg-js'],
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
