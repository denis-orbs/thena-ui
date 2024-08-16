import Image from 'next/image'
import { useTranslations } from 'use-intl'

import { EmphasisButton } from '@/components/buttons/Button'
import { TextHeading, TextSubHeading } from '@/components/typography'

export function Rewards() {
  const t = useTranslations()
  return (
    <div>
      <div className='mt-[10px]'>
        <TextHeading className='block font-archia text-3xl font-semibold leading-9'>{t('Rewards')}</TextHeading>
      </div>
      <div className='mt-[85px]'>
        <div className='grid grid-cols-1 lg:grid-cols-3'>
          <div className='flex w-full justify-center'>
            <div className='flex max-w-[400px] flex-col items-center'>
              <Image alt='reward-image-1' src='/images/reward-logo.png' width='400' height='400' />
              <TextHeading className='mt-7 block text-[40px] font-semibold leading-[53px]'>{t('NFT')}</TextHeading>
              <TextSubHeading className='mt-2  block text-[25px] font-medium leading-5 text-gray-400'>
                2 / 7 {t('fragments required')}
              </TextSubHeading>
              <div className='mt-6  inline-block h-2 w-full rounded-md bg-neutral-500'>
                <div
                  style={{
                    width: `${(2 / 7) * 100}%`,
                  }}
                  className='block h-full rounded-md bg-gradient-to-r from-[#B386FF] to-[#FF86FA]'
                />
              </div>
              <EmphasisButton className='mt-7 px-[45px] py-4'>{t('Mint')}</EmphasisButton>
            </div>
          </div>
          <div className='flex flex-col items-center justify-center'>
            <TextHeading className='mt-[60px] block font-archia text-3xl font-semibold leading-9 lg:mt-[370px]'>
              {t('Airdrops')}
            </TextHeading>
            <TextSubHeading className='mt-2  block text-base font-normal leading-5 text-gray-400'>
              {t('Airdrops description')}
            </TextSubHeading>
          </div>
        </div>
      </div>
    </div>
  )
}
