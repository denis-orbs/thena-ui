import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'use-intl'

import Textarea from '@/components/input/Textarea'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { InstagramIcon } from '@/components/social-icon/ActiveIcon'
import { successToast } from '@/lib/notify'
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

export function ShareReferralLinkModal({ openModal, setOpenModal, referralCode }) {
  const t = useTranslations()
  const [copied, setCopied] = useState(false)
  const [postContent, setPostContent] = useState(
    // eslint-disable-next-line max-len
    `Join THE Story with @ThenaFi_ 💜🏛️ Complete tasks, earn NFT fragments, and rise through the ranks.Start your journey now! Referral Link🔗: https://thena.fi/story?ref=${referralCode}`,
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
          <Link
            href={getShareSocialNetworkUrl({
              network: SocialNetwork.Twitter,
              content: postContent,
              url: referralLink,
            })}
            target='_blank'
            rel='noopener noreferrer'
          >
            <TwitterIcon className='cursor-pointer fill-white/45 hover:fill-white' />
          </Link>
          <Link
            href={getShareSocialNetworkUrl({
              network: SocialNetwork.Telegram,
              content: postContent,
              url: referralLink,
            })}
            target='_blank'
            rel='noopener noreferrer'
          >
            <TelegramIcon className='cursor-pointer fill-white/45 hover:fill-social-telegram' />
          </Link>
          <Link
            href={getShareSocialNetworkUrl({
              network: SocialNetwork.Facebook,
              content: postContent,
              url: referralLink,
            })}
            target='_blank'
            rel='noopener noreferrer'
          >
            <FacebookIcon className='cursor-pointer fill-white/45 hover:fill-social-facebook' />
          </Link>
          <Link
            href={getShareSocialNetworkUrl({
              network: SocialNetwork.Instagram,
              content: postContent,
              url: referralLink,
            })}
            target='_blank'
            rel='noopener noreferrer'
          >
            <InstagramIcon />
          </Link>
          <Link
            href={getShareSocialNetworkUrl({
              network: SocialNetwork.Discord,
              content: postContent,
              url: referralLink,
            })}
            target='_blank'
            rel='noopener noreferrer'
          >
            <DiscordIcon className='cursor-pointer fill-white/45 hover:fill-social-discord' />
          </Link>
          <Link
            href={getShareSocialNetworkUrl({
              network: SocialNetwork.Reddit,
              content: postContent,
              url: referralLink,
            })}
            target='_blank'
            rel='noopener noreferrer'
          >
            <RedditIcon className='cursor-pointer fill-white/45 hover:fill-social-reddit' />
          </Link>
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
