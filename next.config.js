/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // 忽略仅 RN 场景需要的可选依赖，防止打包器去解析
    config.resolve.alias['@react-native-async-storage/async-storage'] = false;
    return config;
  },
};
module.exports = nextConfig;
