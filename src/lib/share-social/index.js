export const SocialNetwork = {
  Twitter: 'Twitter',
  Instagram: 'Instagram',
  Discord: 'Discord',
  Telegram: 'Telegram',
  Reddit: 'Reddit',
  Facebook: 'Facebook',
  Email: 'Email',
}

const facebookAppID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID

export const getShareSocialNetworkUrl = ({ network, content = '', url = '' }) => {
  const encodeContent = encodeURIComponent(content)
  const encodeURL = encodeURIComponent(url)
  switch (network) {
    case SocialNetwork.Twitter: {
      return `https://x.com/intent/tweet?text=${encodeURIComponent(`${content}\n${url}`)}`
    }
    case SocialNetwork.Instagram: {
      return 'https://www.instagram.com/'
    }
    case SocialNetwork.Discord: {
      return 'https://discord.com'
    }
    case SocialNetwork.Telegram: {
      return `https://t.me/share/url?url=${encodeURL}&text=${encodeContent}`
    }
    case SocialNetwork.Reddit: {
      return `https://www.reddit.com/submit?title=${encodeContent}&url=${encodeURL}`
    }
    case SocialNetwork.Facebook: {
      // encodeURL must https
      return `https://www.facebook.com/dialog/share?app_id=${facebookAppID}&display=popup&href=${encodeURL}`
    }
    case SocialNetwork.Email: {
      return `mailto:?subject=${encodeURIComponent('Shared from THENA')}&body=${encodeURIComponent(
        `${content}\n\n${url}`,
      )}`
    }
    default:
      return ''
  }
}
