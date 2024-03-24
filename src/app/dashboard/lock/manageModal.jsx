'use client'

import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import Highlight from '@/components/highlight'
import Modal, { ModalBody } from '@/components/modal'
import { Paragraph, TextHeading } from '@/components/typography'
import { cn } from '@/lib/utils'
import { LockIcon, MergeIcon, SplitIcon, TransferIcon } from '@/svgs'

import LockManage from './lockManage'
import MergeManage from './mergeManage'
import SplitManage from './splitManage'
import TransferManage from './transferManage'

const ManageTypes = {
  lock: 'Lock',
  merge: 'Merge',
  split: 'Split',
  transfer: 'Transfer',
}

export default function ManageModal({ veTHE, popup, setPopup, theAsset, updateVeTHEs }) {
  const [type, setType] = useState(null)
  const t = useTranslations()

  const typesData = useMemo(
    () => [
      {
        content: (
          <div className='flex items-start gap-4 lg:items-center'>
            <Highlight>
              <LockIcon className='h-4 w-4' />
            </Highlight>
            <div className='flex flex-col gap-1'>
              <TextHeading>{t('Lock')}</TextHeading>
              <Paragraph className='text-sm'>{t('Lock Description')}</Paragraph>
            </div>
          </div>
        ),
        onClickHandler: () => {
          setType(ManageTypes.lock)
        },
      },
      {
        content: (
          <div className='flex items-start gap-4 lg:items-center'>
            <Highlight>
              <MergeIcon className='h-4 w-4' />
            </Highlight>
            <div className='flex flex-col gap-1'>
              <TextHeading>{t('Merge')}</TextHeading>
              <Paragraph className='text-sm'>{t('Merge Description')}</Paragraph>
            </div>
          </div>
        ),
        onClickHandler: () => {
          setType(ManageTypes.merge)
        },
      },
      {
        content: (
          <div className='flex items-start gap-4 lg:items-center'>
            <Highlight>
              <SplitIcon className='h-4 w-4' />
            </Highlight>
            <div className='flex flex-col gap-1'>
              <TextHeading>{t('Split')}</TextHeading>
              <Paragraph className='text-sm'>{t('Split Description')}</Paragraph>
            </div>
          </div>
        ),
        onClickHandler: () => {
          setType(ManageTypes.split)
        },
      },
      {
        content: (
          <div className='flex items-start gap-4 lg:items-center'>
            <Highlight>
              <TransferIcon className='h-4 w-4' />
            </Highlight>
            <div className='flex flex-col gap-1'>
              <TextHeading>{t('Transfer')}</TextHeading>
              <Paragraph className='text-sm'>{t('Transfer Description')}</Paragraph>
            </div>
          </div>
        ),
        onClickHandler: () => {
          setType(ManageTypes.transfer)
        },
      },
    ],
    [setType, t],
  )

  return (
    <Modal
      isOpen={popup}
      closeModal={() => {
        setPopup(false)
      }}
      title={type ?? t('Manage veTHE #[Number]', { id: veTHE?.id })}
      isBack={!!type}
      onClickHandler={() => {
        setType(null)
      }}
      onAfterClose={() => setType(null)}
    >
      {!type && (
        <ModalBody>
          <div className={cn('rounded-xl border border-neutral-700 bg-transparent')}>
            {typesData.map((ele, idx) => (
              <div
                className={cn(
                  'flex cursor-pointer items-center gap-4 border-b border-neutral-700 p-6 first:rounded-t-xl last:rounded-b-xl last:border-0 hover:bg-neutral-950 hover:bg-opacity-20',
                )}
                key={`selector-${idx}`}
                onClick={() => ele.onClickHandler()}
              >
                {ele.content}
              </div>
            ))}
          </div>
        </ModalBody>
      )}
      {type === ManageTypes.lock && <LockManage selected={veTHE} theAsset={theAsset} updateVeTHEs={updateVeTHEs} />}
      {type === ManageTypes.merge && <MergeManage selected={veTHE} />}
      {type === ManageTypes.split && <SplitManage selected={veTHE} setPopup={setPopup} updateVeTHEs={updateVeTHEs} />}
      {type === ManageTypes.transfer && (
        <TransferManage selected={veTHE} setPopup={setPopup} updateVeTHEs={updateVeTHEs} />
      )}
    </Modal>
  )
}
