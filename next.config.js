const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    dirs: ['src'],
  },
  transpilePackages: ['@0xsquid/widget'],

  reactStrictMode: true,
  swcMinify: true,
  crossOrigin: 'anonymous',

  images: {
    unoptimized: false,
    dangerouslyAllowSVG: true,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.thena.fi',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
      },
      {
        protocol: 'https',
        hostname: 'cdn-images-1.medium.com',
      },
      {
        protocol: 'https',
        hostname: 'medium.com',
      },
      {
        protocol: 'https',
        hostname: 'tokens.pancakeswap.finance',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.orbs.com',
      },
      {
        protocol: 'https',
        hostname: 'w3s.link',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
    ],
  },

  webpack(config) {
    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find(rule => rule.test?.test?.('.svg'))

    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: { not: /\.(css|scss|sass)$/ },
        resourceQuery: { not: /url/ }, // exclude if *.svg?url
        loader: '@svgr/webpack',
        options: {
          dimensions: false,
          titleProp: true,
        },
      },
    )

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i
    config.resolve.fallback = { fs: false, net: false, tls: false }
    config.externals.push('pino-pretty', 'lokijs', 'encoding')

    return config
  },

  async rewrites() {
    const isProd = process.env.NODE_ENV === 'production'
    return [
      {
        source: '/api/proxy/1inch/:path*',
        destination: 'https://api.1inch.dev/:path*',
      },
      {
        source: '/api/contract/:path*',
        destination: 'https://alpha-hedger.rasa.capital/:path*',
      },
      {
        source: '/s3/image/:path*',
        destination: isProd
          ? 'https://thena-image-resource.s3.amazonaws.com/:path*'
          : 'https://thena-image-resource-dev.s3.amazonaws.com/:path*',
      },
      {
        source: '/s3/download/:path*',
        destination: 'http://thena-s3.s3.eu-west-2.amazonaws.com/:path*',
      },
      {
        source: '/s3/icon-checkmark/:path*',
        destination: isProd
          ? 'https://thena-icon-checkmark.s3.amazonaws.com/:path*'
          : 'https://thena-icon-checkmark-dev.s3.amazonaws.com/:path*',
      },
      {
        source: '/logos/:path*',
        destination: 'https://cdn.thena.fi/logos/:path*',
      },
      {
        source: '/element-market/:path*',
        destination: 'https://api.element.market/:path*',
      },
    ]
  },
}

module.exports = withBundleAnalyzer(nextConfig)
