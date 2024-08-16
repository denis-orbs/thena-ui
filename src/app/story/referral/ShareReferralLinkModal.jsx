import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'use-intl'

import Textarea from '@/components/input/Textarea'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { successToast } from '@/lib/notify'
import {
  CheckPurpleIcon,
  CopyIcon,
  DiscordIcon,
  EmailIcon,
  FacebookIcon,
  MediumIcon,
  RedditIcon,
  TelegramIcon,
  TwitterIcon,
} from '@/svgs'

export function ShareReferralLinkModal({ openModal, setOpenModal }) {
  const link = 'https://thena.fi/invite?ref=4X0JEX'
  const t = useTranslations()
  const [copied, setCopied] = useState(false)
  const defaultText =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras lacinia orci id euismod mollis. Etiam in sem quis urna porttitor vehicula ut quis https://thena.fi/invite?ref=4X0JEX'
  const onCopy = useCallback(
    e => {
      e.stopPropagation()
      e.preventDefault()
      navigator.clipboard.writeText(link)
      successToast(t('Copied'))
      setCopied(true)
    },
    [link, t],
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
      width={560}
      title={t('Share Your Referral Link')}
    >
      <ModalBody>
        <div className=''>
          <p className='text-lg font-medium'>{t('Your Referral Code')}</p>
          <div className='mt-2 flex cursor-text items-center justify-between rounded-lg bg-neutral-700 px-4 py-3'>
            <span>https://thena.fi/invite?ref=4X0JEX</span>
            <div onClick={onCopy} className='inline-block h-6 w-6 cursor-pointer'>
              {copied ? <CheckPurpleIcon /> : <CopyIcon />}
            </div>
          </div>
        </div>
        <div className=''>
          <p className='text-lg font-medium'>{t('Customize your text')}</p>
          <Textarea rows={5} val={defaultText} placeholder={defaultText} />
        </div>
      </ModalBody>
      <ModalFooter>
        <p className='text-lg font-medium'>{t('Your Referral Code')}</p>
        <div className='grid grid-cols-7 gap-[27px]'>
          <TwitterIcon />
          <MediumIcon />
          <DiscordIcon />
          <TelegramIcon />
          <RedditIcon />
          <FacebookIcon />
          <EmailIcon />
        </div>
      </ModalFooter>
    </Modal>
  )
}
