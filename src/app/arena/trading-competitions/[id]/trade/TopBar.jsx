import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React from 'react'

import Box from '@/components/box'
import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { ArrowLeftIcon } from '@/svgs'

function TopBar() {
  const { id } = useParams()
  const t = useTranslations()

  const { push } = useRouter()

  return (
    <div className='my-10 flex flex-col gap-10'>
      <div>
        <TextButton
          className='mb-6 pl-1'
          LeadingIcon={ArrowLeftIcon}
          onClick={() => push(`/arena/trading-competitions/${id}`)}
        >
          {t('Back')}
        </TextButton>
        <div className='flex justify-between'>
          <TextHeading className='text-xl lg:text-3xl'>Fabio vel iudice vincam, sunt in culpa qui officia.</TextHeading>
          <PrimaryButton>{t('Deposit')}</PrimaryButton>
        </div>
      </div>
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-4'>
        <Box className='flex flex-col items-start'>
          <TextHeading className='text-xl lg:text-2xl'>5/100</TextHeading>
          <TextSubHeading>{t('Your Rank')}</TextSubHeading>
        </Box>
        <Box className='flex flex-col items-start'>
          <TextHeading className='text-xl lg:text-2xl'>$100</TextHeading>
          <TextSubHeading>{t('Your Profit & Loss')}</TextSubHeading>
        </Box>
        <Box className='flex flex-col items-start'>
          <div className='flex items-center justify-center space-x-2'>
            <Image
              alt='USDC'
              src='https://cdn.thena.fi/assets/USDC.png'
              className='flex-shrink-0'
              width={24}
              height={24}
              loading='lazy'
            />
            <TextHeading className='text-xl lg:text-2xl'>123</TextHeading>
          </div>
          <TextSubHeading>{t('Your Balance')}</TextSubHeading>
        </Box>
        <Box className='flex flex-col items-start'>
          <TextHeading className='text-xl lg:text-2xl'>1h 29min 4sec</TextHeading>
          <TextSubHeading>{t('Competition End')}</TextSubHeading>
        </Box>
      </div>
      <Box className='flex flex-col space-y-2 border border-primary-800 bg-primary-950'>
        <TextHeading className='text-xl'>{t('Whenever You Make A Swap')}</TextHeading>
        <TextHeading className='text-base font-normal'>{t('If You Want To Know The Real PnL')}</TextHeading>
      </Box>
    </div>
  )
}

export default TopBar
