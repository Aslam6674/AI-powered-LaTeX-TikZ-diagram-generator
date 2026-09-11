/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/granite/:path*",
        destination: `${process.env.GRANITE_API_URL ?? "https://us-south.ml.cloud.ibm.com"}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
