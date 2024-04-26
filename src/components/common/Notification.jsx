'use client'

import React from 'react'
import 'dayjs/locale/zh'
import 'dayjs/locale/en'

import dayjs from '@/lib/arenaDayjs'
import { cn } from '@/lib/utils'
import { BellIcon, CalendarWhiteIcon } from '@/svgs'

import { EmphasisIconButton } from '../buttons/IconButton'
import Highlight from '../highlight'
import Popover from '../popover'
import { Paragraph, TextHeading } from '../typography'

export function Notification() {
  const notifications = [
    {
      id: 232,
      title: 'Notifications',
      timestamp: 1714103254,
    },
    {
      id: 2321,
      title: 'Notifications',
      timestamp: 1714103254,
    },
    {
      id: 2322,
      title: 'Notifications',
      timestamp: 1714103254,
    },
    {
      id: 2324,
      title: 'Notifications',
      timestamp: 1714103254,
    },
    {
      id: 2325,
      title: 'Notifications',
      timestamp: 1714103254,
    },
    {
      id: 23221,
      title: 'Notifications',
      timestamp: 1714103254,
    },
    {
      id: 2325436,
      title: 'Notifications',
      timestamp: 1714103254,
    },
    {
      id: 232432,
      title: 'Notifications',
      timestamp: 1714103254,
    },
    {
      id: 232543,
      title: 'Notifications',
      timestamp: 1714103254,
    },
  ]

  return (
    <>
      <Popover
        triggerElement={
          <EmphasisIconButton
            Icon={BellIcon}
            className={cn(
              "relative after:absolute after:right-1/4 after:top-1/4 after:h-2 after:w-2 after:rounded-full after:bg-primary-600 after:content-['']",
            )}
          />
        }
      >
        <div className='max-h-96 min-h-20 max-w-sm overflow-y-auto'>
          {notifications?.map(notification => (
            <div className='flex h-20 w-80 items-center gap-4' key={notification.id}>
              <Highlight className='bg-gradient-to-t from-[#9A5EFF] to-primary-600'>
                <CalendarWhiteIcon className='h-4 w-4 text-black' />
              </Highlight>
              <div className='flex flex-col gap-1'>
                <TextHeading>{`Competition ${notification.title} has ended`}</TextHeading>
                <Paragraph className='text-sm'>
                  {dayjs(notification.timestamp * 1000)
                    .locale('en') // TODO: change after set language
                    .fromNow()}
                </Paragraph>
              </div>
            </div>
          ))}
        </div>
      </Popover>
    </>
  )
}
