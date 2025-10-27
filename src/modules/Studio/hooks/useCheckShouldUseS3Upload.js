import Bowser from 'bowser'

import { useWindowSize } from '@/hooks/useWindowSize'

function getBrowserName() {
  const { userAgent } = window.navigator
  const browser = Bowser.getParser(userAgent)

  // Detect dApp browsers/wallets
  if (userAgent.includes('Binance') || userAgent.includes('binance')) {
    return 'Binance'
  }
  if (userAgent.includes('Trust') || userAgent.includes('trust')) {
    return 'Trust Wallet'
  }
  if (userAgent.includes('MetaMask') || userAgent.includes('metamask')) {
    return 'MetaMask'
  }
  if (userAgent.includes('Coinbase') || userAgent.includes('coinbase')) {
    return 'Coinbase Wallet'
  }
  if (userAgent.includes('WalletConnect') || userAgent.includes('walletconnect')) {
    return 'WalletConnect'
  }

  return browser.getBrowser().name || 'Unknown'
}

function isDAppBrowser() {
  const dAppBrowsers = ['Binance', 'Trust Wallet', 'MetaMask', 'Coinbase Wallet', 'WalletConnect']

  return dAppBrowsers.includes(getBrowserName())
}

function isPopularBrowser() {
  const popularBrowsers = [
    'Chrome',
    'Safari',
    'Edge',
    'Firefox',
    'Opera',
    'Brave',
    'Samsung Internet',
    'UC Browser',
    'DuckDuckGo',
    'Vivaldi',
  ]

  if (isDAppBrowser()) {
    return false
  }

  return popularBrowsers.includes(getBrowserName())
}

export default function useCheckShouldUseS3Upload() {
  const windowSize = useWindowSize()

  const isPCDevice = windowSize.width >= 1024
  const isDApp = isDAppBrowser()
  return isDApp || (!isPCDevice && !isPopularBrowser())
}
