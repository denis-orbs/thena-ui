'use client'

import moment from 'moment'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import { useCallback, useMemo } from 'react'
import 'moment/locale/zh-cn'

import { cn, formatAddress, isHexColor } from '@/lib/utils'
import { useLocaleSettings } from '@/state/settings/hooks'
import { AnnouncementIcon, Verified } from '@/svgs'

import Highlight from '../highlight'
import CircleImage from '../image/CircleImage'
import { Paragraph, TextHeading } from '../typography'

const protocol_regex = /^(http|https)/

function NotificationItem({ notification, markRead }) {
  const { locale } = useLocaleSettings()
  const t = useTranslations()

  const contentElement = useMemo(() => {
    let notificationContent = notification.content
    const splitContent = notificationContent.split(' ')
    if (splitContent[0]?.length > 12) {
      splitContent[0] = formatAddress(splitContent[0])
      notificationContent = splitContent.join(' ')
    }
    const defaultContent = <TextHeading className='text-wrap break-words'>{notificationContent}</TextHeading>

    if (
      notification.type &&
      ['follow', 'unfollow', 'competition', 'general'].includes(notification.type) &&
      notification.userTrigger
    ) {
      let content = ''
      switch (notification.type) {
        case 'follow':
          content = t('User Follow Notify')
          break
        case 'unfollow':
          content = t('User UnFollow Notify')
          break
        case 'competition':
          content = notificationContent.split(' ').slice(1).join(' ')
          break
        default:
          return defaultContent
      }
      return (
        <TextHeading className='gap-1 text-wrap break-words'>
          <span
            style={
              notification.userTrigger.nameColor
                ? {
                    color: notification.userTrigger.nameColor.startsWith('#')
                      ? notification.userTrigger.nameColor
                      : `#${notification.userTrigger.nameColor}`,
                  }
                : {}
            }
            className={cn(!isHexColor(notification.userTrigger.nameColor) && `${notification.userTrigger.nameColor}`)}
          >
            {notification.userTrigger.username
              ? notification.userTrigger.username
              : formatAddress(notification.userTrigger.id)}
          </span>
          {notification.userTrigger.isVerified ? (
            notification.userTrigger.checkMarkIcon ? (
              <Image
                src={notification.userTrigger.checkMarkIcon}
                width={20}
                height={20}
                className='ml-1 inline-block h-5 w-5 cursor-pointer'
                alt='demo-checkmark'
              />
            ) : (
              <Verified className='ml-1 inline-block h-5 w-5 cursor-pointer' />
            )
          ) : null}{' '}
          {content}
        </TextHeading>
      )
    }

    return defaultContent
  }, [notification.content, notification.type, notification.userTrigger, t])

  const NotificationIcon = useCallback(() => {
    if (notification.type === 'general') {
      return (
        <Highlight className='bg-gradient-to-t from-[#9A5EFF] to-primary-600'>
          <AnnouncementIcon className='h-5 w-5' />
        </Highlight>
      )
    }
    return <CircleImage src={notification.userTrigger?.avatar ?? Avatar} alt='avatar' className='size-9 h-9 w-9' />
  }, [notification.type, notification.userTrigger?.avatar])

  const redirectUrl = useMemo(() => {
    if (notification.type === 'general') {
      return protocol_regex.test(notification.redirectUrl) ? notification.redirectUrl : `//${notification.redirectUrl}`
    }
    return notification.redirectUrl ?? '#'
  }, [notification.redirectUrl, notification.type])

  return (
    <Link
      href={redirectUrl}
      rel='nofollow noopener noreferrer'
      target={notification.type === 'general' ? '_blank' : ''}
    >
      <div
        onClick={() => markRead(notification.id, notification.type)}
        className={cn(
          'flex min-w-80 items-center gap-4',
          !notification.isRead &&
            "relative after:absolute after:right-5 after:top-1/2 after:h-2 after:w-2 after:rounded-full after:bg-primary-600 after:content-['']",
        )}
      >
        <div className='flex h-12 w-12 min-w-12 items-center justify-center'>
          <NotificationIcon />
        </div>
        <div className='flex flex-col gap-1 p-2'>
          {contentElement}
          <Paragraph className='text-sm'>{moment(notification.timestamp).locale(locale).fromNow()}</Paragraph>
        </div>
      </div>
    </Link>
  )
}

export default NotificationItem
