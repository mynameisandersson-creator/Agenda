/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const apiProxyUrl = process.env.API_PROXY_URL ?? 'http://localhost:4000';

    return [
      {
        source: '/api/:path*',
        destination: `${apiProxyUrl}/api/:path*`
      }
    ];
  }
};

export default nextConfig;
