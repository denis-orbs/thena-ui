import localFont from 'next/font/local'

// Optimize Inter font with next/font for automatic optimization
export const inter = localFont({
  src: [
    {
      path: '../../public/fonts/Inter-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Inter-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Inter-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Inter-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
  display: 'swap', // Prevents invisible text during font load
  preload: true,
})

// Optimize Archia font with next/font
export const archia = localFont({
  src: [
    {
      path: '../../public/fonts/Archia-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Archia-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Archia-Semibold.otf',
      weight: '600',
      style: 'normal',
    },
  ],
  variable: '--font-archia',
  display: 'swap',
  preload: true,
})

// Optimize Aeonik font with next/font
export const aeonik = localFont({
  src: [
    {
      path: '../../public/fonts/Aeonikpro-Air.otf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-aeonik',
  display: 'swap',
  preload: false, // Less critical, load on demand
})
