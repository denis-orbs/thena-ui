import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'

import Box from '@/components/box'
import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { ArrowLeftIcon, InfoIcon } from '@/svgs'

function TopBar({ handleClickShowModal = () => {}, competition = {} }) {
  const { id } = useParams()
  const t = useTranslations()

  const [isRegistrable, setIsRegistrable] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now() / 1000
      const registerEndTime = competition?.timestamp?.registrationEnd
      const registerStartTime = competition?.timestamp?.registrationStart
      if (registerStartTime <= now && now <= registerEndTime) {
        setIsRegistrable(true)
      } else {
        setIsRegistrable(false)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [competition?.timestamp?.registrationEnd, competition?.timestamp?.registrationStart])

  return (
    <div className='my-10 flex flex-col gap-10'>
      <div>
        <Link href={`/arena/trading-competitions/${id}`}>
          <TextButton className='mb-6 pl-1' LeadingIcon={ArrowLeftIcon}>
            {t('Back')}
          </TextButton>
        </Link>
        <div className='flex justify-between'>
          <TextHeading className='text-xl lg:text-3xl'>{competition?.name}</TextHeading>
          {isRegistrable && (
            <PrimaryButton onClick={handleClickShowModal}>{`${t('Deposit')} ${t('More')}`}</PrimaryButton>
          )}
        </div>
      </div>
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-4'>
        <Box className='flex flex-col items-start'>
          <TextHeading className='text-xl lg:text-2xl'>5/100</TextHeading>
          <TextSubHeading>{t('Your Rank')}</TextSubHeading>
        </Box>
        <Box className='flex flex-col items-start'>
          <div className='flex w-full items-center justify-between lg:flex'>
            <TextHeading className='text-xl lg:text-2xl'>$100</TextHeading>
            <InfoIcon className='hidden h-4 w-4 stroke-neutral-400 lg:block' />
          </div>
          <TextSubHeading>{t('Your Profit & Loss')}</TextSubHeading>
        </Box>
        <Box className='flex flex-col items-start'>
          <div className='flex w-full items-center justify-between lg:flex'>
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
            <InfoIcon className='hidden h-4 w-4 stroke-neutral-400 lg:block' />
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
