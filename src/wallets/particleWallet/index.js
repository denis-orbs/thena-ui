import { createConnector } from 'wagmi'

import { googleIcon, particleIcon, twitterIcon } from './icons'
import { particleWagmiWallet } from './particleWagmiWallet'

export const particleWallet = () => ({
  id: 'particle',
  name: 'Particle Wallet',
  iconUrl: async () => particleIcon,
  iconBackground: '#fff',
  installed: true,
  createConnector: walletDetails =>
    createConnector(config => ({
      ...particleWagmiWallet()(config),
      ...walletDetails,
    })),
})

export const particleGoogleWallet = () => ({
  id: 'particle_google',
  name: 'Google',
  iconUrl: async () => googleIcon,
  iconBackground: '#fff',
  installed: true,
  createConnector: walletDetails =>
    createConnector(config => ({
      ...particleWagmiWallet({ socialType: 'google' })(config),
      ...walletDetails,
    })),
})

export const particleTwitterWallet = () => ({
  id: 'particle_twitter',
  name: 'Twitter',
  iconUrl: async () => twitterIcon,
  iconBackground: '#fff',
  installed: true,
  createConnector: walletDetails =>
    createConnector(config => ({
      ...particleWagmiWallet({ socialType: 'twitter' })(config),
      ...walletDetails,
    })),
})
