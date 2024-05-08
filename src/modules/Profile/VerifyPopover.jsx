import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React, { useCallback } from 'react'

import Popover from '@/components/popover'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { CalendarIcon, Verified } from '@/svgs'

// TODO: update after get verify time
export function VerifyPopover({ verifyImage, verifiedAt }) {
  const t = useTranslations()

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
    <Popover triggerElement={<VerifiedElement />} position='top-center'>
      <div className='w-96'>
        <TextHeading className='mb-2 text-lg'>{t('Verified Profile')}</TextHeading>
        <div className='mt-4 flex gap-4'>
          <div className='h-5 w-5'>
            <VerifiedElement />
          </div>
          <TextSubHeading>{t('This Account Is Verified')}</TextSubHeading>
        </div>
        {/* TODO: update this */}
        {verifiedAt && (
          <div className='mt-4 flex gap-4'>
            <div className='ml-1 h-5 w-5'>
              <CalendarIcon className='h-5 w-5' />
            </div>
            <TextSubHeading>{t('Verified Since', { date: 'Nov 03, 2023' })}</TextSubHeading>
          </div>
        )}
      </div>
    </Popover>
  )
}
