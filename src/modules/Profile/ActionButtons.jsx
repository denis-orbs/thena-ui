'use client'

import Bowser from 'bowser'
import html2canvas from 'html2canvas-pro'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useState } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import Textarea from '@/components/input/Textarea'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { InstagramIcon } from '@/components/social-icon/ActiveIcon'
import { useCreatePresignedUrl } from '@/hooks/useUploadFile'
import useWallet from '@/hooks/useWallet'
import { useWindowSize } from '@/hooks/useWindowSize'
import { getShareSocialNetworkUrl, SocialNetwork } from '@/lib/share-social'
import { rewriteS3Host } from '@/lib/utils'
import {
  DiscordIcon,
  DownloadIcon,
  EmailIcon,
  FacebookIcon,
  RedditIcon,
  ShareProfileIcon,
  TelegramIcon,
  TwitterIcon,
} from '@/svgs'

// Utility function for delays
const delay = ms =>
  new Promise(resolve => {
    setTimeout(resolve, ms)
  })

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

export default function ActionButtons({ fileName, scale = 1, backgroundColor = '#0B040D' }) {
  const t = useTranslations()
  const { account } = useWallet()
  const { createPresignedUrl } = useCreatePresignedUrl()
  const [isDownloading, setIsDownloading] = useState(false)
  const [openShareModal, setOpenShareModal] = useState(false)

  const windowSize = useWindowSize()

  const handleDownloadS3Image = useCallback(
    async imageUrl => {
      try {
        const tempLink = document.createElement('a')
        tempLink.href = `/s3/download/${rewriteS3Host(imageUrl, 'cdn.thena.fi/')}`
        tempLink.download = `${fileName}.png`
        tempLink.click()

        // Wait a bit to ensure download started
        await delay(1000)
      } catch (error) {
        console.error('Error downloading S3 image:', error)
        throw error
      }
    },
    [fileName],
  )

  const uploadToS3AndDownload = useCallback(
    async blob => {
      if (!account) {
        throw new Error('Account not available')
      }

      return new Promise((resolve, reject) => {
        createPresignedUrl(blob, account.toLowerCase(), 'PROFILE', data => {
          handleDownloadS3Image(data)
            .then(() => resolve())
            .catch(error => reject(error))
        })
      })
    },
    [account, createPresignedUrl, handleDownloadS3Image],
  )

  const directDownload = useCallback(
    async blob => {
      try {
        const tempLink = document.createElement('a')
        tempLink.href = URL.createObjectURL(blob)
        tempLink.download = `${fileName}.png`
        tempLink.target = '_blank'
        tempLink.click()

        // Clean up the object URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(tempLink.href)
        }, 1000)

        // Wait a bit to ensure download started
        await delay(500)
      } catch (error) {
        console.error('Error with direct download:', error)
        throw error
      }
    },
    [fileName],
  )

  const handleRender = async () => {
    if (isDownloading) return

    setIsDownloading(true)

    try {
      const originShare = document.getElementById('share-origin')

      if (!originShare) {
        throw new Error('Share element not found')
      }

      const canvas = await html2canvas(originShare, {
        width: 1024,
        height: 576,
        scale,
        allowTaint: true,
        useCORS: true,
        removeContainer: true,
        backgroundColor,
        onclone(clonedDoc) {
          const clonedElement = clonedDoc.getElementById('share-origin')
          if (clonedElement) {
            clonedElement.style.display = 'block'
            clonedElement.style.width = '1024px'
            clonedElement.style.height = '576px'
            clonedElement.style.borderRadius = 'none'
          }
        },
      })

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(_blob => {
          if (!_blob) {
            reject(new Error('Failed to create image blob'))
          } else {
            resolve(_blob)
          }
        })
      })

      const isPCDevice = windowSize.width >= 1024
      const isDApp = isDAppBrowser()

      const shouldUseS3Upload = isDApp || (!isPCDevice && !isPopularBrowser())

      if (shouldUseS3Upload) {
        const file = new File([blob], `${fileName}.png`, { type: 'image/png' })
        await uploadToS3AndDownload(file)
      } else {
        await directDownload(blob)
      }
    } catch (error) {
      console.error('Error processing image download:', error)

      if (isDAppBrowser()) {
        console.log('dApp browser detected, using S3 upload method')
      }
    } finally {
      setIsDownloading(false)
    }
  }

  const isPCDevice = windowSize.width >= 1024
  const isDApp = isDAppBrowser()
  const shouldUseS3Upload = isDApp || (!isPCDevice && !isPopularBrowser())

  return shouldUseS3Upload && !account ? (
    <ConnectButton className='w-full' />
  ) : (
    <>
      <PrimaryButton onClick={() => setOpenShareModal(true)} className='h-full w-1/2' disabled={isDownloading}>
        <ShareProfileIcon className='[&>path]:stroke-primary-100 h-4 w-4' />
        {t('Share')}
      </PrimaryButton>
      <EmphasisButton onClick={handleRender} className='h-full w-1/2' disabled={isDownloading}>
        {isDownloading ? (
          <>
            <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
            {`${t('Downloading')}...`}
          </>
        ) : (
          <>
            <DownloadIcon className='h-4 w-4' />
            {t('Download')}
          </>
        )}
      </EmphasisButton>
      <ShareImageModal openShareModal={openShareModal} setOpenShareModal={setOpenShareModal} />
    </>
  )
}

function ShareImageModal({ openShareModal, setOpenShareModal }) {
  const [postContent, setPostContent] = useState('')
  const referralLink = useMemo(() => 'https://thena.fi/', [])
  const t = useTranslations()

  const handleOpenShareWindow = useCallback(data => {
    const targetUrl = getShareSocialNetworkUrl(data)
    const width = window.screen.width / 2
    const height = window.screen.height / 2
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2

    window.open(targetUrl, '_blank', `noopener,noreferrer,width=${width},height=${height},left=${left},top=${top}`)
  }, [])
  return (
    <Modal title={t('Share Image')} isOpen={openShareModal} closeModal={() => setOpenShareModal(false)}>
      <ModalBody>
        <div className=''>
          <p className='text-lg font-medium'>{t('Customize your text')}</p>
          <Textarea
            className='h-[180px] md:h-[130px]'
            val={postContent}
            onChange={e => {
              setPostContent(e.target.value)
            }}
          />
        </div>
      </ModalBody>
      <ModalFooter className='mt-0'>
        <p className='text-lg font-medium'>{t('Share on')}</p>
        <div className='mt-3 grid grid-cols-5 gap-5 md:grid-cols-7 md:gap-12 lg:gap-7'>
          <div
            onClick={
              () =>
                handleOpenShareWindow({
                  network: SocialNetwork.Twitter,
                  content: postContent,
                  url: referralLink,
                })
              // eslint-disable-next-line react/jsx-curly-newline
            }
            className=''
          >
            <TwitterIcon className='cursor-pointer fill-white/45 hover:fill-white' />
          </div>
          <div
            onClick={
              () =>
                handleOpenShareWindow({
                  network: SocialNetwork.Telegram,
                  content: postContent,
                  url: referralLink,
                })
              // eslint-disable-next-line react/jsx-curly-newline
            }
          >
            <TelegramIcon className='hover:fill-social-telegram cursor-pointer fill-white/45' />
          </div>
          <div
            onClick={
              () =>
                handleOpenShareWindow({
                  network: SocialNetwork.Facebook,
                  content: postContent,
                  url: referralLink,
                })
              // eslint-disable-next-line react/jsx-curly-newline
            }
          >
            <FacebookIcon className='hover:fill-social-facebook cursor-pointer fill-white/45' />
          </div>
          <div
            onClick={
              () =>
                handleOpenShareWindow({
                  network: SocialNetwork.Instagram,
                  content: postContent,
                  url: referralLink,
                })
              // eslint-disable-next-line react/jsx-curly-newline
            }
          >
            <InstagramIcon />
          </div>
          <div
            onClick={
              () =>
                handleOpenShareWindow({
                  network: SocialNetwork.Discord,
                  content: postContent,
                  url: referralLink,
                })
              // eslint-disable-next-line react/jsx-curly-newline
            }
          >
            <DiscordIcon className='hover:fill-social-discord cursor-pointer fill-white/45' />
          </div>
          <div
            onClick={
              () =>
                handleOpenShareWindow({
                  network: SocialNetwork.Reddit,
                  content: postContent,
                  url: referralLink,
                })
              // eslint-disable-next-line react/jsx-curly-newline
            }
          >
            <RedditIcon className='hover:fill-social-reddit cursor-pointer fill-white/45' />
          </div>
          <Link
            href={getShareSocialNetworkUrl({
              network: SocialNetwork.Email,
              content: postContent,
              url: referralLink,
            })}
            target='_blank'
            rel='noopener noreferrer'
          >
            <EmailIcon className='cursor-pointer fill-white/45 hover:fill-white' />
          </Link>
        </div>
      </ModalFooter>
    </Modal>
  )
}
