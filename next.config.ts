import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Turbopack 默认启用（Next.js 15），提高开发编译速度
  reactStrictMode: true,

  // PWA 配置通过 public/manifest.json 实现基础支持
  // 完整 Service Worker 可在后续版本添加

  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ],
};

export default nextConfig;
