'use client'

import Link from 'next/link'
import useSWR from 'swr'
import 'dayjs/locale/en'
import 'dayjs/locale/zh'

import { fetchUserNotifcations } from '@/hooks/useNotifications'
import dayjs from '@/lib/arenaDayjs'
import { cn } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { useLocaleSettings } from '@/state/settings/hooks'
import { BellIcon, CalendarWhiteIcon } from '@/svgs'

import { EmphasisIconButton } from '../buttons/IconButton'
import Highlight from '../highlight'
import Popover from '../popover'
import { Paragraph, TextHeading } from '../typography'

export function Notification() {
  const { account } = useWallet()
  const { locale } = useLocaleSettings()
  const { data: notifications } = useSWR(
    ['notifications', account?.toLowerCase()],
    () => fetchUserNotifcations(account),
    {
      refreshInterval: 30000,
    },
  )
  if (!account || !notifications?.length) {
    return null
  }

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
        <div className='max-h-96 min-h-20 max-w-[500px] overflow-y-auto'>
          {notifications?.map(notification => (
            <Link href={notification.redirectUrl ?? '#'}>
              <div className='flex h-20 min-w-80 items-center gap-4' key={notification.id}>
                <Highlight className='bg-gradient-to-t from-[#9A5EFF] to-primary-600'>
                  <CalendarWhiteIcon className='h-4 w-4 text-black' />
                </Highlight>
                <div className='flex flex-col gap-1'>
                  <TextHeading>{notification.content}</TextHeading>
                  <Paragraph className='text-sm'>
                    {dayjs(notification.timestamp * 1000)
                      .locale(locale) // TODO: change after set language
                      .fromNow()}
                  </Paragraph>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Popover>
    </>
  )
}
