import { AuthType } from '@particle-network/auth-core'
import { createConnector } from 'wagmi'

import {
  appleIcon,
  discordIcon,
  emailIcon,
  facebookIcon,
  githubIcon,
  googleIcon,
  linkedinIcon,
  microsoftIcon,
  particleIcon,
  phoneIcon,
  twitchIcon,
  twitterIcon,
} from './icons'
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
  iconUrl: async () => emailIcon,
  iconBackground: '#fff',
  installed: true,
  createConnector: walletDetails =>
    createConnector(config => ({
      ...particleWagmiWallet()(config),
      ...walletDetails,
    })),
})

export const particlePhoneWallet = () => ({
  id: 'particle_phone',
  name: 'Phone',
  iconUrl: async () => phoneIcon,
  iconBackground: '#fff',
  installed: true,
  createConnector: walletDetails =>
    createConnector(config => ({
      ...particleWagmiWallet()(config),
      ...walletDetails,
    })),
})

export const particleFacebookWallet = () => ({
  id: 'particle_facebook',
  name: 'Facebook',
  iconUrl: async () => facebookIcon,
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
  iconUrl: async () => googleIcon,
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
  iconUrl: async () => appleIcon,
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
  iconUrl: async () => discordIcon,
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
  iconUrl: async () => githubIcon,
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
  iconUrl: async () => twitchIcon,
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
  iconUrl: async () => twitterIcon,
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
  iconUrl: async () => microsoftIcon,
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
  name: 'Linkedin',
  iconUrl: async () => linkedinIcon,
  iconBackground: '#fff',
  installed: true,
  createConnector: walletDetails =>
    createConnector(config => ({
      ...particleWagmiWallet({ socialType: AuthType.linkedin })(config),
      ...walletDetails,
    })),
})
