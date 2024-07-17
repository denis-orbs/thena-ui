'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useRef } from 'react'
import { toast } from 'react-toastify'
import useSWR from 'swr'
import 'dayjs/locale/en'
import 'dayjs/locale/zh'

import { fetchUserNotifcations, useMarkNotificationRead, useNotificationsSubscription } from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { BellIcon } from '@/svgs'

import NotificationItem from './NotificationItem'
import { TextButton } from '../buttons/Button'
import { EmphasisIconButton } from '../buttons/IconButton'
import Popover from '../popover'
import { TextHeading } from '../typography'

export function Notification() {
  const { account } = useWallet()
  const t = useTranslations()
  const audioRef = useRef()
  const { data: notifications, mutate } = useSWR(
    ['notifications', account?.toLowerCase()],
    () => fetchUserNotifcations(account),
    {
      refreshInterval: 60000,
    },
  )

  const { markRead } = useMarkNotificationRead()

  const markNotiAsRead = useCallback(
    async (id, type) => {
      await markRead(id, type)
      mutate()
    },
    [markRead, mutate],
  )

  const handleNewNotification = useCallback(
    data => {
      if (data.newNotification) {
        toast.success(<NotificationItem notification={data.newNotification} markRead={markNotiAsRead} />, {
          icon: false,
        })
        mutate()
        const { current } = audioRef
        if (current) {
          current.play()
        }
      }
    },
    [markNotiAsRead, mutate],
  )

  useNotificationsSubscription(handleNewNotification)

  const hasUnread = useMemo(() => notifications?.some(item => !item.isRead), [notifications])

  return (
    <>
      {account && !!notifications?.length && (
        <Popover
          triggerElement={
            <EmphasisIconButton
              Icon={BellIcon}
              className={cn(
                hasUnread
                  ? "relative after:absolute after:right-1/4 after:top-1/4 after:h-2 after:w-2 after:rounded-full after:bg-primary-600 after:content-['']"
                  : '',
              )}
            />
          }
        >
          <div className='mx-2 flex items-center justify-between'>
            <TextHeading className='text-xl'>{t('Notifications')}</TextHeading>
            {hasUnread && (
              <TextButton className='p-1 text-sm' onClick={() => markNotiAsRead(null)}>
                {t('Mark All As Read')}
              </TextButton>
            )}
          </div>
          <div className='relative max-h-96 min-h-20 w-[300px] overflow-y-auto lg:w-[350px]'>
            {notifications?.map(notification => (
              <NotificationItem key={notification.id} notification={notification} markRead={markNotiAsRead} />
            ))}
          </div>
        </Popover>
      )}
      <audio ref={audioRef} className='hide'>
        <source src='/sounds/notification_sound.mp3' type='audio/mp3' />
        <track src='captions_en.vtt' kind='captions' srcLang='en' label='english_captions' />
      </audio>
    </>
  )
}
