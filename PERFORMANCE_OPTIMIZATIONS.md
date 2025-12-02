# Performance Optimizations Guide

This document outlines the performance optimizations implemented in the Thena Frontend codebase.

## ✅ Completed Optimizations

### 1. Bundle Size Optimizations

#### Lodash Tree-Shaking

- **Before**: `import _ from 'lodash'` (imports entire 70KB library)
- **After**: `import filter from 'lodash/filter'` (imports only needed functions)
- **Files Optimized**:
  - `src/lib/api.js`
  - `src/app/t2e/YourEarning.jsx`
- **Impact**: ~60KB+ reduction in bundle size

#### Moment.js → Dayjs Migration

- **Before**: `moment.js` (67KB)
- **After**: `dayjs` (7KB) - 90% smaller
- **Files Updated**:
  - `src/modules/TradingCompetition/TradeHistory.jsx`
  - `src/hooks/position/useManualPosition.js`
  - `src/hooks/position/useFarmPosition.js`
  - `src/hooks/fusion/useEstimateAPR.js`
  - `src/app/arena/thena-id/RecentlyContent.jsx`
- **Impact**: ~60KB reduction in bundle size

### 2. Code Splitting & Lazy Loading

#### Language Files

- **Implementation**: Dynamic imports for non-English locales
- **Location**: `src/app/providers.jsx`
- **Impact**: Only loads the selected language (~200-500KB saved per unused locale)

#### Heavy Components

- **Components Dynamically Loaded**:
  - `Home` component
  - `Footer` component
  - Chart components (`BarChart`, `LineChart`, `HoverableChart`, `AnalyticsChart`)
  - Arena analytics charts
- **Impact**: Faster initial page load, better code splitting

### 3. Font Optimization

#### Next.js Font Optimization

- **Implementation**: Using `next/font/local` for automatic font optimization
- **Location**: `src/lib/fonts.js`
- **Features**:
  - Automatic font subsetting
  - Self-hosting optimization
  - `font-display: swap` for better loading performance
  - CSS variable integration
- **Impact**: Reduced font loading time, better Core Web Vitals

### 4. Build Optimizations

#### Webpack Configuration

- **Package Import Optimization**: Automatic tree-shaking for:
  - `lodash`
  - `@rainbow-me/rainbowkit`
  - `recharts`, `chart.js`, `react-chartjs-2`
  - `d3`, `lightweight-charts`
- **Compression**: Enabled gzip compression
- **Location**: `next.config.js`

## 📊 Bundle Analysis

### Running Bundle Analyzer

To analyze your bundle size:

```bash
yarn build:analyze
```

This will:

1. Build your application with bundle analysis enabled
2. Open an interactive visualization showing:
   - Bundle sizes
   - Chunk breakdown
   - Dependency tree
   - Duplicate dependencies

### Interpreting Results

- **Large chunks**: Look for opportunities to code-split
- **Duplicate dependencies**: Check for multiple versions of the same package
- **Unused code**: Identify dead code that can be removed

## 🖼️ Image Optimization Recommendations

### Current Status

- ✅ Next.js Image component is being used
- ✅ AVIF and WebP formats are enabled
- ⚠️ Some images may benefit from conversion

### Recommended Actions

1. **Convert Large PNGs to WebP/AVIF**

   - Check images in `public/images/` directory
   - Focus on:
     - `home/hero/` images
     - `home/scenes/` images
     - `story/` background images
   - Use tools like:
     - [Squoosh](https://squoosh.app/)
     - [ImageOptim](https://imageoptim.com/)
     - Next.js built-in optimization (already enabled)

2. **Lazy Load Below-the-Fold Images**

   - Ensure `loading="lazy"` is set for images below the fold
   - Use `priority` prop only for above-the-fold images

3. **Optimize Image Sizes**
   - Use appropriate `sizes` prop for responsive images
   - Consider using `srcset` for different screen sizes

### Example Optimization Script

```bash
# Install image optimization tools
npm install -g sharp-cli

# Convert PNG to WebP (example)
sharp -i public/images/home/hero/blob.png -o public/images/home/hero/blob.webp
```

## 🚀 Additional Optimization Opportunities

### 1. Service Worker / PWA

- Consider implementing a service worker for offline support
- Cache static assets for faster subsequent loads

### 2. Prefetching

- Use Next.js `<Link prefetch>` for important routes
- Prefetch critical API data

### 3. React Optimization

- Use `React.memo()` for expensive components
- Implement `useMemo()` and `useCallback()` where appropriate
- Consider virtualization for long lists

### 4. API Optimization

- Implement request deduplication
- Add response caching
- Use SWR/React Query caching effectively (already implemented)

### 5. Third-Party Scripts

- Load analytics scripts asynchronously (already done)
- Consider using `next/script` with `strategy="lazyOnload"` for non-critical scripts

## 📈 Performance Metrics

### Before Optimizations

- Initial bundle size: ~X MB (measure with analyzer)
- Load time: ~X seconds (measure with Lighthouse)

### After Optimizations

- Initial bundle size: Reduced by ~120KB+ (lodash + moment)
- Language files: Only loaded on demand
- Font loading: Optimized with `font-display: swap`

### Monitoring

Use these tools to monitor performance:

- **Lighthouse**: Built into Chrome DevTools
- **WebPageTest**: https://www.webpagetest.org/
- **Vercel Analytics**: Already integrated
- **Bundle Analyzer**: Run `yarn build:analyze`

## 🔧 Maintenance

### Regular Tasks

1. **Monthly**: Run bundle analyzer to check for new large dependencies
2. **Quarterly**: Review and optimize large images
3. **After major updates**: Check for duplicate dependencies

### Best Practices

- Always use specific imports from lodash
- Prefer dayjs over moment for new code
- Use dynamic imports for heavy components
- Monitor bundle size in CI/CD

## 📝 Notes

- Font optimization is backward compatible - old @font-face rules remain as fallback
- Language file loading is transparent to users (English preloaded)
- All optimizations are production-ready and tested

## 🐛 Troubleshooting

### Fonts not loading?

- Check that font files exist in `public/fonts/`
- Verify font paths in `src/lib/fonts.js`
- Check browser console for errors

### Bundle size still large?

- Run `yarn build:analyze` to identify large dependencies
- Check for duplicate package versions
- Look for unused imports

### Performance issues?

- Check Network tab in DevTools
- Use Lighthouse to identify bottlenecks
- Monitor Core Web Vitals in Vercel Analytics
