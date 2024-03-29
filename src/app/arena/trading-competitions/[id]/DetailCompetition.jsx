'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import { Collapse } from '@/components/collapse'
import Tabs from '@/components/tabs'
import { Paragraph, TextHeading } from '@/components/typography'
import { SizeTypes } from '@/constant/type'

function DetailCompetition() {
  const t = useTranslations()
  const [selectedTab, setSelectedTab] = useState('Details')

  const subTabs = useMemo(
    () => [
      {
        label: t('Details'),
        active: selectedTab === 'Details',
        onClickHandler: () => {
          setSelectedTab('Details')
        },
      },
      {
        label: t('Leaderboard'),
        active: selectedTab === 'Leaderboard',
        onClickHandler: () => {
          setSelectedTab('Leaderboard')
        },
      },
      {
        label: t('Participants'),
        active: selectedTab === 'Participants',
        onClickHandler: () => {
          setSelectedTab('Participants')
        },
      },
      {
        label: t('Analytics'),
        active: selectedTab === 'Analytics',
        onClickHandler: () => {
          setSelectedTab('Analytics')
        },
      },
    ],
    [selectedTab, t],
  )

  return (
    <div className='mt-10 flex w-full flex-col gap-4'>
      <Tabs data={subTabs} size={SizeTypes.Small} itemClassName='text-sm' className='justify-start overflow-x-scroll' />
      <Box>
        <Collapse title={t('Description')}>
          <p className='mt-4 text-sm text-neutral-300'>
            Lorem ipsum dolor, sit amet consectetur adipisicing elit. Harum eum corporis sapiente, assumenda facilis
            cumque nihil eos atque vero ipsa! In fugiat deserunt quos ipsum iste temporibus nostrum consequatur soluta.
          </p>
        </Collapse>
      </Box>

      <Box>
        <TextHeading className='text-xl'> {t('Detail')} </TextHeading>
        <div className='lg: mt-4 grid grid-flow-col grid-rows-4 gap-4 lg:grid-flow-row lg:grid-cols-3 lg:grid-rows-3'>
          <div className='flex flex-col gap-2'>
            <TextHeading className='text-lg'>{t('Participants')}</TextHeading>
            <Paragraph>2,210</Paragraph>
          </div>
          <div className='flex flex-col gap-2'>
            <TextHeading className='text-lg'>{t('Entry Fee')}</TextHeading>
            <Paragraph>2,210</Paragraph>
          </div>
          <div className='flex flex-col gap-2'>
            <TextHeading className='text-lg'>{t('Competition Type')}</TextHeading>
            <Paragraph>2,210</Paragraph>
          </div>
          <div className='flex flex-col gap-2'>
            <TextHeading className='text-lg'>{t('Current Price Pool')}</TextHeading>
            <div className='flex space-x-2'>
              <Image
                alt=''
                src='https://cdn.thena.fi/assets/BUSD.png'
                className='flex-shrink-0'
                width={20}
                height={20}
                loading='lazy'
              />
              <Paragraph>2,210</Paragraph>
            </div>
          </div>
          <div className='flex flex-col gap-2'>
            <TextHeading className='text-lg'>{t('Max Prize Pool')}</TextHeading>
            <div className='flex space-x-2'>
              <Image
                alt=''
                src='https://cdn.thena.fi/assets/BUSD.png'
                className='flex-shrink-0'
                width={20}
                height={20}
                loading='lazy'
              />
              <Paragraph>2,210</Paragraph>
            </div>
          </div>
          <div className='flex flex-col gap-2'>
            <TextHeading className='text-lg'>{t('Hot Contribution')}</TextHeading>
            <div className='flex space-x-2'>
              <Image
                alt=''
                src='https://cdn.thena.fi/assets/BUSD.png'
                className='flex-shrink-0'
                width={20}
                height={20}
                loading='lazy'
              />
              <Paragraph>2,210</Paragraph>
            </div>
          </div>
          <div className='flex flex-col gap-2'>
            <TextHeading className='text-lg'>{t('Deposit Token')}</TextHeading>
            <div className='flex space-x-2'>
              <Image
                alt=''
                src='https://cdn.thena.fi/assets/BUSD.png'
                className='flex-shrink-0'
                width={20}
                height={20}
                loading='lazy'
              />
              <Paragraph>BUSD</Paragraph>
            </div>
          </div>
          <div className='flex flex-col gap-2'>
            <TextHeading className='text-lg'>{t('Required Deposit To Join')}</TextHeading>
            <div className='flex space-x-2'>
              <Image
                alt=''
                src='https://cdn.thena.fi/assets/BUSD.png'
                className='flex-shrink-0'
                width={20}
                height={20}
                loading='lazy'
              />
              <Paragraph>2,210</Paragraph>
            </div>
          </div>
        </div>
      </Box>
      <Box>
        <div className='flex justify-between'>
          <TextHeading className='text-xl'> {t('Prize distribution')} </TextHeading>
          <EmphasisButton className='p-2 text-xs'>{t('View all')}</EmphasisButton>
        </div>
        <div className='mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3'>
          <div className='flex flex-col gap-2'>
            <TextHeading className='text-lg'>{t('Host', { percent: 2 })}</TextHeading>
            <div className='flex space-x-2'>
              <Image
                alt=''
                src='https://cdn.thena.fi/assets/BUSD.png'
                className='flex-shrink-0'
                width={20}
                height={20}
                loading='lazy'
              />
              <Paragraph>2,210</Paragraph>
            </div>
          </div>
          {Array.from({ length: 2 }).map((item, index) => (
            <div className='flex flex-col gap-2'>
              <TextHeading className='text-lg'>{t('Place', { value: index + 1, percent: 80 })}</TextHeading>
              <div className='flex space-x-2'>
                <Image
                  alt=''
                  src='https://cdn.thena.fi/assets/BUSD.png'
                  className='flex-shrink-0'
                  width={20}
                  height={20}
                  loading='lazy'
                />
                <Paragraph>2,210</Paragraph>
              </div>
            </div>
          ))}
        </div>
      </Box>
      <Box>
        <div className='flex justify-between'>
          <TextHeading className='text-xl'> {t('Tradable Tokens', { value: 8 })} </TextHeading>
          <EmphasisButton className='p-2 text-xs'>{t('View All')}</EmphasisButton>
        </div>
        <div className='mt-4 grid  grid-cols-2 gap-4 lg:grid-cols-4'>
          {Array.from({ length: 8 }).map(item => (
            <Box
              className='flex items-center space-x-2.5 bg-neutral-800 px-4 py-4 md:space-x-3 lg:px-4 lg:py-4'
              key={item}
            >
              <Image
                alt=''
                src='https://cdn.thena.fi/assets/BUSD.png'
                className='flex-shrink-0'
                width={28}
                height={28}
                loading='lazy'
              />
              <div className='flex flex-col'>
                <Paragraph className='text-sm'>BUSD</Paragraph>
                <Paragraph className='text-nowrap text-sm'>Binance USD</Paragraph>
              </div>
            </Box>
          ))}
        </div>
      </Box>
    </div>
  )
}

export default DetailCompetition
