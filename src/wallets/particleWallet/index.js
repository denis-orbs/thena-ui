import { AuthType } from '@particle-network/auth-core'
import { createConnector } from 'wagmi'

import { particleIcon } from './icons'
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

export const particleEmailWallet = () => ({
  id: 'particle_email',
  name: 'Email',
  iconUrl: '/images/socials/email.png',
  iconBackground: '#fff',
  installed: true,
  createConnector: walletDetails =>
    createConnector(config => ({
      ...particleWagmiWallet({ socialType: AuthType.email })(config),
      ...walletDetails,
    })),
})

export const particlePhoneWallet = () => ({
  id: 'particle_phone',
  name: 'Phone',
  iconUrl: '/images/socials/phone.png',
  iconBackground: '#fff',
  installed: true,
  createConnector: walletDetails =>
    createConnector(config => ({
      ...particleWagmiWallet({ socialType: AuthType.phone })(config),
      ...walletDetails,
    })),
})

export const particleFacebookWallet = () => ({
  id: 'particle_facebook',
  name: 'Facebook',
  iconUrl: '/images/socials/facebook.png',
  iconBackground: '#fff',
  installed: true,
  createConnector: walletDetails =>
    createConnector(config => ({
      ...particleWagmiWallet({ socialType: AuthType.facebook })(config),
      ...walletDetails,
    })),
})

export const particleGoogleWallet = () => ({
  id: 'particle_google',
  name: 'Google',
  iconUrl: '/images/socials/google.png',
  iconBackground: '#fff',
  installed: true,
  createConnector: walletDetails =>
    createConnector(config => ({
      ...particleWagmiWallet({ socialType: AuthType.google })(config),
      ...walletDetails,
    })),
})

export const particleAppleWallet = () => ({
  id: 'particle_apple',
  name: 'Apple',
  iconUrl: '/images/socials/apple.png',
  iconBackground: '#fff',
  installed: true,
  createConnector: walletDetails =>
    createConnector(config => ({
      ...particleWagmiWallet({ socialType: AuthType.apple })(config),
      ...walletDetails,
    })),
})

export const particleDiscordWallet = () => ({
  id: 'particle_discord',
  name: 'Discord',
  iconUrl: '/images/socials/discord.png',
  iconBackground: '#fff',
  installed: true,
  createConnector: walletDetails =>
    createConnector(config => ({
      ...particleWagmiWallet({ socialType: AuthType.discord })(config),
      ...walletDetails,
    })),
})

export const particleGithubWallet = () => ({
  id: 'particle_github',
  name: 'Github',
  iconUrl: '/images/socials/github.png',
  iconBackground: '#fff',
  installed: true,
  createConnector: walletDetails =>
    createConnector(config => ({
      ...particleWagmiWallet({ socialType: AuthType.github })(config),
      ...walletDetails,
    })),
})

export const particleTwitchWallet = () => ({
  id: 'particle_twitch',
  name: 'Twitch',
  iconUrl: '/images/socials/twitch.png',
  iconBackground: '#fff',
  installed: true,
  createConnector: walletDetails =>
    createConnector(config => ({
      ...particleWagmiWallet({ socialType: AuthType.twitch })(config),
      ...walletDetails,
    })),
})

export const particleTwitterWallet = () => ({
  id: 'particle_twitter',
  name: 'Twitter',
  iconUrl: '/images/socials/twitter.png',
  iconBackground: '#fff',
  installed: true,
  createConnector: walletDetails =>
    createConnector(config => ({
      ...particleWagmiWallet({ socialType: AuthType.twitter })(config),
      ...walletDetails,
    })),
})

export const particleMicrosoftWallet = () => ({
  id: 'particle_microsoft',
  name: 'Microsoft',
  iconUrl: '/images/socials/microsoft.png',
  iconBackground: '#fff',
  installed: true,
  createConnector: walletDetails =>
    createConnector(config => ({
      ...particleWagmiWallet({ socialType: AuthType.microsoft })(config),
      ...walletDetails,
    })),
})

export const particleLinkedinWallet = () => ({
  id: 'particle_linkedin',
  name: 'LinkedIn',
  iconUrl: '/images/socials/linkedin.png',
  iconBackground: '#fff',
  installed: true,
  createConnector: walletDetails =>
    createConnector(config => ({
      ...particleWagmiWallet({ socialType: AuthType.linkedin })(config),
      ...walletDetails,
    })),
})
