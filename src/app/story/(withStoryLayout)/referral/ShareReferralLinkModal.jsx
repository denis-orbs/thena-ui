import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'use-intl'

import Textarea from '@/components/input/Textarea'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { InstagramIcon } from '@/components/social-icon/ActiveIcon'
import { useTHEStory } from '@/context/THEStoryContext'
import { errorToast, successToast } from '@/lib/notify'
import { getShareSocialNetworkUrl, SocialNetwork } from '@/lib/share-social'
import {
  CheckPurpleIcon,
  CopyIcon,
  DiscordIcon,
  EmailIcon,
  FacebookIcon,
  RedditIcon,
  TelegramIcon,
  TwitterIcon,
} from '@/svgs'

const PostContent = `I’ve just joined THE Story with @ThenaFi_ 💜🏛️

First tasks completed, NFT fragment collected, and I’m on the path to over $30K in rewards!

Who’s with me? #StoryofTHENA

https://thena.fi/story`

export function ShareReferralLinkModal({ openModal, setOpenModal, referralCode }) {
  const t = useTranslations()
  const { campaignParticipantInfo } = useTHEStory()
  const [copied, setCopied] = useState(false)
  const [postContent, setPostContent] = useState(
    // eslint-disable-next-line max-len
    `${PostContent}?ref=${referralCode}`,
  )

  const referralLink = useMemo(() => `https://thena.fi/story?ref=${referralCode}`, [referralCode])

  const onCopy = useCallback(
    e => {
      e.stopPropagation()
      e.preventDefault()
      navigator.clipboard.writeText(referralLink)
      successToast(t('Copied'))
      setCopied(true)
    },
    [referralLink, t],
  )

  useEffect(() => {
    if (copied) {
      const timeOut = setTimeout(() => setCopied(false), 2000)

      return () => clearTimeout(timeOut)
    }
  }, [copied])

  const handleOpenShareWindow = useCallback(
    data => {
      const targetUrl = getShareSocialNetworkUrl(data)
      if (!campaignParticipantInfo.xProfileUsername && data.network === SocialNetwork.Twitter) {
        errorToast(
          'You have to update the X profile username first!\nhttps://thena.fi/story/edit-profile',
          '',
          null,
          false,
          {
            style: {
              cursor: 'pointer',
            },
            autoClose: 10000,
            onClick: () => (window.location.href = '/story/edit-profile'),
          },
        )
        return
      }
      const width = window.screen.width / 2
      const height = window.screen.height / 2
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2

      window.open(targetUrl, '_blank', `noopener,noreferrer,width=${width},height=${height},left=${left},top=${top}`)
    },
    [campaignParticipantInfo.xProfileUsername],
  )

  return (
    <Modal
      isOpen={openModal}
      closeModal={() => {
        setOpenModal(false)
      }}
      title={t('Share Your Referral Link')}
    >
      <ModalBody>
        <div>
          <p className='text-lg font-medium'>{t('Your Referral Code')}</p>
          <div className='mt-2 flex cursor-text items-center justify-between rounded-lg bg-neutral-700 px-4 py-3'>
            <span>{referralLink}</span>
            <div onClick={onCopy} className='inline-block h-6 w-6 cursor-pointer'>
              {copied ? <CheckPurpleIcon /> : <CopyIcon />}
            </div>
          </div>
        </div>
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
