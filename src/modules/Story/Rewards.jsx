import Image from 'next/image'
import React from 'react'
import { useTranslations } from 'use-intl'

import { SecondaryButton } from '@/components/buttons/Button'

import ProgressBar from './ProgressBar'

function RewardItem({ item }) {
  return (
    <div className='col-span-12 p-0 lg:col-span-4'>
      <Image className='mx-auto' src={item.thumb} alt='Apollo Warrior' width={399.88} height={399.88} />
      <p className='mb-7 text-center text-[40px] text-neutral-50'>{item.title}</p>
      <div className='mx-auto mb-7 px-14'>
        <div className='col-span-12 mb-6 text-center'>{`${item.totalComplete}/${item.totalStep} ${item.description} required`}</div>
        <ProgressBar process={`${(item.totalComplete / item.totalStep) * 100}%`} />
      </div>
      <div className='flex justify-center'>
        <SecondaryButton className='h-[44px] w-[124px] bg-[#35243D] text-neutral-300'>Mint</SecondaryButton>
      </div>
    </div>
  )
}

function Rewards() {
  const t = useTranslations()
  const data = [
    {
      id: 1,
      title: 'NFT',
      thumb: '/images/story/apollo-warrior-light.png',
      totalStep: 7,
      totalComplete: 2,
      description: 'fragments',
    },
    {
      id: 2,
      title: 'Airdrops',
      thumb: '',
      totalStep: 7,
      totalComplete: 5,
      description: 'points',
    },
  ]
  return (
    <div className='mb-[250px] grid grid-cols-12 gap-8 lg:gap-12'>
      <div className='col-span-12 mb-[60.54px]'>
        <p className='text-[40px] font-semibold text-neutral-50'>{t('Rewards')}</p>
      </div>
      {data.map(item => (
        <RewardItem item={item} />
      ))}
    </div>
  )
}

export default Rewards
