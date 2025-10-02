import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline';
              style-src 'self' 'unsafe-inline';
              img-src 'self' blob: data:;
              connect-src 'self';
              font-src 'self';
              frame-ancestors 'none';
              base-uri 'self';
            `.replace(/\s{2,}/g, ' '),
                    },
                ],
            },
        ];
    },

    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
