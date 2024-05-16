'use client'

import moment from 'moment'
import Link from 'next/link'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import 'moment/locale/zh-cn'

import { cn } from '@/lib/utils'
import { useLocaleSettings } from '@/state/settings/hooks'

import CircleImage from '../image/CircleImage'
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
        <div className='h-12 w-12'>
          <CircleImage src={Avatar} alt='avatar' className='size-9 h-9 w-9' />
        </div>
        <div className='flex flex-col gap-1 p-2'>
          <TextHeading className='text-wrap break-words'>{notification.content}</TextHeading>
          <Paragraph className='text-sm'>{moment(notification.timestamp).locale(locale).fromNow()}</Paragraph>
        </div>
      </div>
    </Link>
  )
}

export default NotificationItem
