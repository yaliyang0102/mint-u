/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // 避免可选依赖被解析（仅为降噪）
    config.resolve.alias['pino-pretty'] = false;
    return config;
  }
};
module.exports = nextConfig;
