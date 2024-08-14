'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React from 'react'

import ApolloWarrior from '@/modules/Story/ApolloWarrior'
import CheckDailyRight from '@/modules/Story/CheckDailyRight'
import CheckInDailyLeft from '@/modules/Story/CheckInDailyLeft'
import CollectEnoughPoint from '@/modules/Story/CollectEnoughPoint'
import CollectFragment from '@/modules/Story/CollectFragment'
import CompleteWeeklyTasksLeft from '@/modules/Story/CompleteWeeklyTasksLeft'
import CompleteWeeklyTasksRight from '@/modules/Story/CompleteWeeklyTasksRight'
import InviteYourFriends from '@/modules/Story/InviteYourFriends'
import StoryRegister from '@/modules/Story/StoryRegister'

function StoryPage() {
  const t = useTranslations()
  return (
    <div className='mt-6 flex flex-col gap-4'>
      <div className='w-full'>
        <div className='mb-[250px] mt-6 grid grid-cols-12 gap-8 lg:gap-12'>
          <div className='col-span-12 my-auto px-10 lg:col-span-6'>
            <p className='text-[18px] font-medium uppercase leading-[21.78px] text-gradient'>
              {t('The story of Thena')}
            </p>
            <p className='mb-3 text-7xl font-semibold text-white'>{t('Join the Adventure and Earn Rewards!')}</p>
            <p className='leading-6 text-[#D1D0D2]'>{t('Complete different tasks and win all kind of rewards.')}</p>
          </div>
          <StoryRegister />
        </div>
        <div className='mb-[250px] mt-6 grid grid-cols-12 gap-8 lg:gap-12'>
          <CollectFragment />
          <ApolloWarrior />
        </div>
        <div className='mb-[250px] mt-6 flex justify-end gap-8 lg:gap-12'>
          <CollectEnoughPoint />
        </div>
        <div className='mb-[250px] mt-6 gap-8 lg:gap-12'>
          <div className='col-span-12 mb-36 grid gap-8 lg:gap-12'>
            <h2 className='mx-auto'>{t('How to Earn Fragments and Points?')}</h2>
          </div>
          <div className='mb-[100px] grid grid-cols-12'>
            <CompleteWeeklyTasksLeft />
            <CompleteWeeklyTasksRight />
          </div>
          <div className='mb-[200px] grid grid-cols-12'>
            <div className='relative col-span-12 ml-20 lg:col-span-6'>
              <Image src='/images/story/invite.png' width={363.3} height={348.81} />
            </div>
            <InviteYourFriends />
          </div>
          <div className='mb-[200px] grid grid-cols-12'>
            <CheckInDailyLeft />
            <CheckDailyRight />
          </div>
        </div>
      </div>
    </div>
  )
}

export default StoryPage
