'use client'

import html2canvas from 'html2canvas-pro'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import Textarea from '@/components/input/Textarea'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { InstagramIcon } from '@/components/social-icon/ActiveIcon'
import { useCreatePresignedUrl } from '@/hooks/useUploadFile'
import useWallet from '@/hooks/useWallet'
import { getShareSocialNetworkUrl, SocialNetwork } from '@/lib/share-social'
import { cn } from '@/lib/utils'
import { DiscordIcon, EmailIcon, FacebookIcon, RedditIcon, ShareProfileIcon, TelegramIcon, TwitterIcon } from '@/svgs'

export default function ShareImage({ fileName, scale = 1, backgroundColor = '#0B040D', className }) {
  const [uploading, setUploading] = useState(false)
  const [openShareModal, setOpenShareModal] = useState(false)
  const [postContent, setPostContent] = useState('')
  const [imageUrl, setImageUrl] = useState(null)
  const t = useTranslations()
  const { account } = useWallet()
  const { createPresignedUrl } = useCreatePresignedUrl()

  const handleUploading = async () => {
    if (uploading || !account) return

    setUploading(true)

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
      const file = new File([blob], `${fileName}.png`, { type: 'image/png' })

      await createPresignedUrl(
        file,
        account.toLowerCase(),
        'PROFILE',
        async data => {
          setImageUrl(data)
          setUploading(false)
          setOpenShareModal(true)
        },
        () => {
          setUploading(false)
        },
      )
    } catch (error) {
      console.error('Error processing image download:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleOpenShareWindow = useCallback(data => {
    const targetUrl = getShareSocialNetworkUrl(data)
    const width = window.screen.width / 2
    const height = window.screen.height / 2
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2

    window.open(targetUrl, '_blank', `noopener,noreferrer,width=${width},height=${height},left=${left},top=${top}`)
  }, [])
  return (
    <>
      <PrimaryButton
        onClick={async () => {
          await handleUploading()
        }}
        className={cn('h-full w-1/2', className)}
        disabled={uploading}
      >
        <ShareProfileIcon className='[&>path]:stroke-primary-100 h-4 w-4' />
        {t('Share')}
      </PrimaryButton>
      <Modal title={t('Share Image')} isOpen={openShareModal} closeModal={() => setOpenShareModal(false)}>
        <ModalBody>
          <div className=''>
            <p className='text-lg font-medium'>{t('Your text')}</p>
            <Textarea
              className='h-[180px] md:h-[130px]'
              val={postContent}
              placeholder='Type here'
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
                    url: imageUrl,
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
                    url: imageUrl,
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
                    url: imageUrl,
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
                    url: imageUrl,
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
                    url: imageUrl,
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
                    url: imageUrl,
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
                url: imageUrl,
              })}
              target='_blank'
              rel='noopener noreferrer'
            >
              <EmailIcon className='cursor-pointer fill-white/45 hover:fill-white' />
            </Link>
          </div>
        </ModalFooter>
      </Modal>
    </>
  )
}
