import { useTranslations } from 'next-intl'
import React from 'react'

import { SecondaryButton } from '@/components/buttons/Button'
import ChevronRightIcon from '@/modules/Story/ChevronRightIcon'

export default function CollectFragment() {
  const t = useTranslations()

  return (
    <div className='col-span-12 my-auto flex h-[178px] w-[589.2px] flex-col justify-between gap-10 px-10 lg:col-span-6'>
      <p className='text-[40px] font-semibold text-neutral-50'>{t('Earn Fragments and Win an NFT')}</p>
      <p className='leading-6 text-neutral-300'>
        <span className='font-bold'>{t('Collect fragments')}&nbsp;</span>
        {t('by completing weekly tasks and later on you can use them to mint new NFT that will bring different perks.')}
      </p>
      <SecondaryButton type='submit' className='h-[44px] w-[124px] bg-[#DF08D4] text-neutral-100'>
        {t('Start')}
        <ChevronRightIcon />
      </SecondaryButton>
    </div>
  )
}
