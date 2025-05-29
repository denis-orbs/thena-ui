import { useTranslations } from 'next-intl'
import React, { Fragment } from 'react'

import { PrimaryIconButton } from '@/components/buttons/IconButton'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { PiggySecondIcon, SwitchHorizontalV2Icon, WalletIcon } from '@/svgs'

function Work() {
  const t = useTranslations()

  const data = [
    {
      icon: WalletIcon,
      heading: 'Connect your wallet',
      subHeading: ['Go to our perpetual DEX ALPHA and connect your wallet'],
    },
    {
      icon: SwitchHorizontalV2Icon,
      heading: 'Trade on ALPHA',
      subHeading: [
        'The more you trade, the more you earn',
        'Rewards are distributed based on your daily trading volume',
      ],
    },
    {
      icon: PiggySecondIcon,
      heading: 'Claim Earnings',
      subHeading: ['Claim your earnings manually after each epoch ends', 'Epoch resets every 24 hours at 00:00 UTC'],
    },
  ]

  return (
    <div>
      <div className='mb-8'>
        <TextHeading className='text-xl font-semibold md:text-3xl'>{t('How it Works')}</TextHeading>
      </div>
      <div className='mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {data.map((item, index) => (
          <div key={index} className='flex flex-col items-center gap-3'>
            <div className='border-opacity-5 bg-opacity-5 rounded-xl border border-neutral-50 bg-neutral-50 p-2'>
              <PrimaryIconButton Icon={item.icon} className='pointer-events-none lg:h-9 lg:w-9' />
            </div>
            <TextHeading className='text-base'>{t(item.heading)}</TextHeading>
            <TextSubHeading className='text-center text-sm'>
              {item.subHeading.map((sub, ind) => (
                <Fragment key={ind}>
                  {ind !== 0 && <br />}
                  {t(sub)}
                </Fragment>
              ))}
            </TextSubHeading>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Work
