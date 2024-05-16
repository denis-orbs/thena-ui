import React, { useMemo, useState } from 'react'

import Modal, { ModalBody } from '@/components/modal'
import Table from '@/components/table'
import { Paragraph } from '@/components/typography'

const sortOptions = [
  {
    label: 'Sent at',
    value: 'sendAt',
    width: 'w-[10%]',
    isDesc: false,
  },
  {
    label: 'User',
    value: 'users',
    width: 'w-[10%]',
    isDesc: true,
  },
  {
    label: 'Notification',
    value: 'notification',
    width: 'w-[30%]',
    isDesc: true,
    minWidth: 'min-w-40',
    justify: 'justify-center items-center',
  },
  {
    label: 'Redirect',
    value: 'redirect',
    width: 'w-[30%]',
    isDesc: true,
    justify: 'justify-center items-center',
  },
  {
    label: 'Delivered',
    value: 'delivered',
    width: 'w-[10%]',
    isDesc: true,
    justify: 'justify-center items-center',
  },
  {
    label: 'Read',
    value: 'read',
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
export function ModalAnalyticNotification({ onClose, isOpen }) {
  const [sort, setSort] = useState(sortOptions[0])
  const [currentPage, setCurrentPage] = useState(1)

  const data = useMemo(
    () =>
      Array.from({ length: 3 }).map(() => ({
        sendAt: <Paragraph>2024-05-05</Paragraph>,
        users: <Paragraph>5</Paragraph>,
        notification: <Paragraph>noti</Paragraph>,
        redirect: <Paragraph>redirect</Paragraph>,
        delivered: <Paragraph>delivered</Paragraph>,
        read: <Paragraph>read</Paragraph>,
        ctr: <Paragraph>ctr</Paragraph>,
      })),
    [],
  )

  return (
    <Modal isOpen={isOpen} closeModal={onClose} title='Analytics' width={800}>
      <ModalBody>
        <Table
          sortOptions={sortOptions}
          data={data}
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
