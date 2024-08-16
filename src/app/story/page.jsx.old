'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React from 'react'

import { SecondaryButton } from '@/components/buttons/Button'
import CheckDailyRight from '@/modules/Story/CheckDailyRight'
import CheckInDailyLeft from '@/modules/Story/CheckInDailyLeft'
import ChevronRightIcon from '@/modules/Story/ChevronRightIcon'
import CollectEnoughPoint from '@/modules/Story/CollectEnoughPoint'
import CollectFragment from '@/modules/Story/CollectFragment'
import CompleteWeeklyTasksLeft from '@/modules/Story/CompleteWeeklyTasksLeft'
import CompleteWeeklyTasksRight from '@/modules/Story/CompleteWeeklyTasksRight'
import Faq from '@/modules/Story/Faq'
import InviteYourFriends from '@/modules/Story/InviteYourFriends'
import Rewards from '@/modules/Story/Rewards'
import StoryRegister from '@/modules/Story/StoryRegister'

function StoryPage() {
  const t = useTranslations()
  return (
    <>
      <div className='mt-6 flex flex-col gap-4'>
        <div className='w-full'>
          <div className='mb-[250px] mt-6 grid grid-cols-12 gap-8 lg:gap-12'>
            <div className='col-span-12 my-auto lg:col-span-6'>
              <p className='inline-block bg-gradient-to-r from-start-text-gradient to-end-text-gradient bg-clip-text text-[18px] font-medium uppercase leading-[21.78px] text-transparent'>
                {t('The story of Thena')}
              </p>
              <p className='mb-3 text-7xl font-semibold text-white'>{t('Join the Adventure and Earn Rewards!')}</p>
              <p className='leading-6 text-[#D1D0D2]'>{t('Complete different tasks and win all kind of rewards.')}</p>
            </div>
            <StoryRegister />
          </div>
          <div className='mb-[250px] grid grid-cols-12 gap-8 lg:gap-12'>
            <CollectFragment />
            <div className='z-10 col-span-12 p-0 lg:col-span-6'>
              <Image src='/images/story/apollo-warrior-light.png' alt='Apollo Warrior' width={397.02} height={397.02} />
            </div>
          </div>
          <div className='mb-[250px] flex justify-end gap-8 lg:gap-12'>
            <CollectEnoughPoint />
          </div>
          <div className='mb-[250px] gap-8 lg:gap-12'>
            <div className='col-span-12 mb-36 grid gap-8 lg:gap-12'>
              <h2 className='mx-auto'>{t('How to Earn Fragments and Points?')}</h2>
            </div>
            <div className='mb-[250px] grid grid-cols-12'>
              <CompleteWeeklyTasksLeft />
              <CompleteWeeklyTasksRight />
            </div>
            <div className='mb-[200px] grid grid-cols-12'>
              <div className='relative col-span-12 ml-20 lg:col-span-6'>
                <Image src='/images/story/invite.png' width={363.3} height={348.81} />
              </div>
              <InviteYourFriends />
            </div>
            <div className='grid grid-cols-12'>
              <CheckInDailyLeft />
              <CheckDailyRight />
            </div>
          </div>
          <Rewards />
          <Faq />
          <div className=''>
            <p className='mb-4 text-center text-[48px] font-semibold'>{t('Join THE Adventure Now')}</p>
            <div className='flex justify-center'>
              <SecondaryButton className='h-11 w-[128px] bg-[#DC00D4] text-white'>
                Join now <ChevronRightIcon />
              </SecondaryButton>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default StoryPage
