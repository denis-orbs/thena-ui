import localizedFormat from 'dayjs/plugin/localizedFormat'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React, { useCallback, useState } from 'react'
import { Popover } from 'react-tiny-popover'

import { TextHeading, TextSubHeading } from '@/components/typography'
import dayjs from '@/lib/arenaDayjs'
import { useLocaleSettings } from '@/state/settings/hooks'
import { CalendarIcon, Verified } from '@/svgs'

dayjs.extend(localizedFormat)
export function VerifyPopover({ verifyImage, verifiedAt, disablePopover = false }) {
  const t = useTranslations()
  const { locale } = useLocaleSettings()
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const VerifiedElement = useCallback(
    () =>
      verifyImage ? (
        <Image src={verifyImage} width={20} height={20} className='ml-1 h-5 w-5 cursor-pointer' alt='demo-checkmark' />
      ) : (
        <Verified className='ml-1 h-5 w-5 cursor-pointer' />
      ),
    [verifyImage],
  )

  return (
    <Popover
      isOpen={isPopoverOpen && !disablePopover}
      positions={['bottom', 'left']}
      onClickOutside={() => setIsPopoverOpen(false)}
      padding={3}
      content={
        <div className='max-w-80 rounded-md border border-neutral-600 bg-neutral-800 p-3 shadow-sm'>
          <TextHeading className='mb-2 text-lg'>{t('Verified Profile')}</TextHeading>
          <div className='mt-4 flex gap-4'>
            <div className='h-5 w-5'>
              <VerifiedElement />
            </div>
            <TextSubHeading className='text-wrap break-words'>{t('This Account Is Verified')}</TextSubHeading>
          </div>
          {verifiedAt && (
            <div className='mt-4 flex gap-4'>
              <div className='ml-1 h-5 w-5'>
                <CalendarIcon className='h-5 w-5' />
              </div>
              <TextSubHeading>
                {t('Verified Since', { date: dayjs(verifiedAt).tz().locale(locale).format('ll') })}
              </TextSubHeading>
            </div>
          )}
        </div>
      }
    >
      <div
        onClick={e => {
          e.stopPropagation()
          e.preventDefault()
          setIsPopoverOpen(!isPopoverOpen)
        }}
      >
        <VerifiedElement />
      </div>
    </Popover>
  )
}
