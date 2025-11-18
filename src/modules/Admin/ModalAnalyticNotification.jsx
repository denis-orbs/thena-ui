import localizedFormat from 'dayjs/plugin/localizedFormat'
import { gql } from 'graphql-request'
import Link from 'next/link'
import React, { useMemo, useState } from 'react'
import useSWR from 'swr'

import Modal, { ModalBody } from '@/components/modal'
import Skeleton from '@/components/skeleton'
import Table from '@/components/table'
import { Paragraph } from '@/components/typography'
import dayjs from '@/lib/arenaDayjs'
import { ArenaClient } from '@/lib/graphql'
import { useLocaleSettings } from '@/state/settings/hooks'
import { formatNumberDecimals } from '@/utils/utils'

dayjs.extend(localizedFormat)

const V4_ADMIN_NOTIFICATIONS = gql`
  query V4_ADMIN_NOTIFICATIONS {
    adminNotifications {
      clickCount
      redirectUrl
      totalUserSent
      content
      id
      createdAt
      totalUser
      totalUserRead
    }
  }
`

const fetchAdminNotifications = async () => {
  try {
    const { adminNotifications } = await ArenaClient.request(V4_ADMIN_NOTIFICATIONS)
    if (adminNotifications.length) {
      return adminNotifications.map(adminNotification => ({
        ...adminNotification,
        ctr:
          adminNotification.clickCount && adminNotification.totalUserSent
            ? adminNotification.clickCount / adminNotification.totalUserSent
            : 0,
      }))
    }
    return []
  } catch (error) {
    return []
  }
}

const sortOptions = [
  {
    label: 'Send at',
    value: 'createdAt',
    width: 'w-[10%]',
    isDesc: false,
  },
  {
    label: 'User',
    value: 'totalUser',
    width: 'w-[10%]',
    isDesc: true,
    justify: 'justify-center items-center',
  },
  {
    label: 'Notification Content',
    value: 'content',
    width: 'w-[30%]',
    disabled: true,
    minWidth: 'min-w-72',
    justify: 'justify-center items-center',
  },
  {
    label: 'Redirect',
    value: 'redirectUrl',
    width: 'w-[30%]',
    disabled: true,
    justify: 'justify-center items-center',
  },
  {
    label: 'Delivered',
    value: 'totalUserSent',
    width: 'w-[10%]',
    isDesc: true,
    justify: 'justify-center items-center',
  },
  {
    label: 'Read',
    value: 'totalUserRead',
    width: 'w-[10%]',
    isDesc: true,
    justify: 'justify-center items-center',
  },
  {
    label: 'CTR',
    value: 'ctr',
    width: 'w-[10%]',
    isDesc: true,
    justify: 'justify-center items-center',
  },
]

const protocol_regex = /^(http|https)/

export function ModalAnalyticNotification({ onClose, isOpen }) {
  const [sort, setSort] = useState(sortOptions[0])
  const [currentPage, setCurrentPage] = useState(1)
  const { locale } = useLocaleSettings()
  const { data, isLoading } = useSWR(['admin notifications'], () => fetchAdminNotifications())

  const sortedData = useMemo(
    () =>
      data?.sort((a, b) => {
        let res
        switch (sort.value) {
          case 'createdAt':
            res = (a.createdAt - b.createdAt) * (sort.isDesc ? 1 : -1)
            break
          case 'totalUserSent':
            res = (a.totalUserSent - b.totalUserSent) * (sort.isDesc ? 1 : -1)
            break
          case 'totalUser':
            res = (a.totalUser - b.totalUser) * (sort.isDesc ? 1 : -1)
            break
          case 'totalUserRead':
            res = (a.totalUserRead - b.totalUserRead) * (sort.isDesc ? 1 : -1)
            break
          case 'ctr':
            res = (a.ctr - b.ctr) * (sort.isDesc ? 1 : -1)
            break
          default:
            break
        }
        return res
      }),
    [data, sort],
  )

  const adminNotifications = useMemo(() => {
    if (isLoading || !data.length) {
      return [
        {
          createdAt: <Skeleton className='h-[30px] w-full' />,
          totalUser: <Skeleton className='h-[30px] w-full' />,
          content: <Skeleton className='h-[30px] w-full' />,
          redirectUrl: <Skeleton className='h-[30px] w-full' />,
          totalUserSent: <Skeleton className='h-[30px] w-full' />,
          totalUserRead: <Skeleton className='h-[30px] w-full' />,
          ctr: <Skeleton className='h-[30px] w-full' />,
        },
      ]
    }
    return sortedData.map(notification => ({
      createdAt: <Paragraph>{dayjs(notification.createdAt).tz().locale(locale).format('lll')}</Paragraph>,
      totalUser: <Paragraph>{notification.totalUser}</Paragraph>,
      content: <Paragraph className='ellipsis-3 text-wrap'>{notification.content}</Paragraph>,
      redirectUrl: (
        <Link
          href={
            protocol_regex.test(notification.redirectUrl) ? notification.redirectUrl : `//${notification.redirectUrl}`
          }
          target='_blank'
        >
          <Paragraph className='ellipsis-1 text-wrap'>{notification.redirectUrl}</Paragraph>
        </Link>
      ),
      totalUserSent: <Paragraph>{notification.totalUserSent}</Paragraph>,
      totalUserRead: <Paragraph>{notification.totalUserRead}</Paragraph>,
      ctr: <Paragraph>{`${formatNumberDecimals(notification.ctr, 5) * 100}%`}</Paragraph>,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.length, JSON.stringify(sortedData), isLoading])

  return (
    <Modal isOpen={isOpen} closeModal={onClose} title='Analytics' width={1000}>
      <ModalBody>
        <Table
          sortOptions={sortOptions}
          data={adminNotifications}
          sort={sort}
          setSort={setSort}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          tableBasic
        />
      </ModalBody>
    </Modal>
  )
}
