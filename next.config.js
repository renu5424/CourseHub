/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/genkit/:path*',
        destination: 'http://localhost:3400/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
