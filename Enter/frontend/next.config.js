/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy /api/* calls through Vercel → Render backend (eliminates CORS entirely)
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;