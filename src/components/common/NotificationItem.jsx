'use client'

import moment from 'moment'
import Link from 'next/link'
import 'moment/locale/zh-cn'

import { cn } from '@/lib/utils'
import { useLocaleSettings } from '@/state/settings/hooks'
import { UserIcon } from '@/svgs'

import Highlight from '../highlight'
import { Paragraph, TextHeading } from '../typography'

function NotificationItem({ notification, markRead }) {
  const { locale } = useLocaleSettings()

  return (
    <Link href={notification.redirectUrl ?? '#'}>
      <div
        onClick={() => markRead(notification.id)}
        className={cn(
          'flex min-w-72 items-center gap-4',
          !notification.isRead &&
            "relative after:absolute after:right-5 after:top-1/2 after:h-2 after:w-2 after:rounded-full after:bg-primary-600 after:content-['']",
        )}
      >
        <Highlight className='bg-gradient-to-t from-[#9A5EFF] to-primary-600'>
          <UserIcon className='h-4 w-4 text-black' />
        </Highlight>
        <div className='flex flex-col gap-1 p-2'>
          <TextHeading className='text-wrap break-all'>{notification.content}</TextHeading>
          <Paragraph className='text-sm'>{moment(notification.timestamp).locale(locale).fromNow()}</Paragraph>
        </div>
      </div>
    </Link>
  )
}

export default NotificationItem
