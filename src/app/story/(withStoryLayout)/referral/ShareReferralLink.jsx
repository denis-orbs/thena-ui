import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'use-intl'

import { PrimaryButton } from '@/components/buttons/Button'
import { SuccessMessage } from '@/components/message'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { CheckPurpleIcon, CopyIcon, ShareIcon } from '@/svgs'

import { ShareReferralLinkModal } from './ShareReferralLinkModal'

export function ShareReferralLink({ referralCode }) {
  const t = useTranslations()
  const [copied, setCopied] = useState(false)
  const [openModal, setOpenModal] = useState(false)
  const referralLink = useMemo(() => `https://thena.fi/story?ref=${referralCode}`, [referralCode])

  const copyHandler = useCallback(
    e => {
      e.stopPropagation()
      e.preventDefault()
      navigator.clipboard.writeText(referralLink)
      // successToast(t('Copied'))
      setCopied(true)
    },
    [referralLink],
  )

  useEffect(() => {
    if (copied) {
      const timeOut = setTimeout(() => setCopied(false), 2000)

      return () => clearTimeout(timeOut)
    }
  }, [copied])

  const shareHandler = useCallback(() => {
    setOpenModal(true)
  }, [])

  return (
    <div className='border-gradient-secondary relative rounded-xl p-px'>
      <div className='rounded-xl bg-neutral-900 p-4 xl:p-6'>
        <TextHeading className='font-archia text-3xl font-semibold'>{t('Share Your Referral Link')}</TextHeading>
        <TextSubHeading className='mt-2 block text-base leading-5 font-normal text-neutral-300'>
          {t('Share Your Referral Link Description')}
        </TextSubHeading>
        <p className='mt-6 text-lg font-medium'>{t('Your Referral Code')}</p>
        <div className='mt-2 flex cursor-text items-center justify-between rounded-lg bg-neutral-700 px-4 py-3'>
          <span>{referralLink}</span>
          <div onClick={copyHandler} className='inline-block h-6 w-6 cursor-pointer'>
            {copied ? <CheckPurpleIcon /> : <CopyIcon />}
          </div>
        </div>
        <PrimaryButton className='mt-6 flex w-full items-center justify-center' onClick={shareHandler}>
          <ShareIcon className='inline-block h-4 w-4' />
          <span className='text-base font-medium'>{t('Share')}</span>
        </PrimaryButton>
      </div>
      {copied && (
        <div
          className='absolute bottom-[-48px] flex w-full justify-center'
          style={{
            transform: 'translate(0, 100%)',
          }}
        >
          <div className='w-full rounded-lg bg-neutral-800 p-4 md:max-w-[311px]'>
            <SuccessMessage title={t('Copied')} />
          </div>
        </div>
      )}
      {openModal && (
        <ShareReferralLinkModal openModal={openModal} setOpenModal={setOpenModal} referralCode={referralCode} />
      )}
    </div>
  )
}
