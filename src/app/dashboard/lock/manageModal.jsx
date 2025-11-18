'use client'

import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import Highlight from '@/components/highlight'
import NextImage from '@/components/image/NextImage'
import Modal, { ModalBody } from '@/components/modal'
import { Paragraph, TextHeading } from '@/components/typography'
import { AUTOMATION_STATUS } from '@/constant'
import { useAutomationContractDetail, useVeTheAutomations } from '@/hooks/automationContract/useAutomationContract'
import cn from '@/utils/classes'

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

  const { data: veTHEs } = useVeTheAutomations()
  const found = veTHEs?.find(item => item.id === veTHE?.id)
  const status = found?.statusString ?? AUTOMATION_STATUS.NO
  const { contractData, mutateAutomationData } = useAutomationContractDetail(veTHE?.id)

  const typesData = useMemo(
    () => [
      {
        content: (
          <div className='flex items-start gap-4 lg:items-center'>
            <Highlight>
              <NextImage src='/svgs/lock.svg' alt='lock icon' className='size-4' />
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
              <NextImage src='/svgs/merge.svg' alt='merge icon' className='size-4' />
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
              <NextImage src='/svgs/split.svg' alt='split icon' className='size-4' />
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
              <NextImage src='/svgs/switch-horizontal.svg' alt='horizontal icon' className='size-4' />
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
      isIntl={!type}
    >
      {!type && (
        <ModalBody>
          <div className={cn('rounded-xl border border-neutral-700 bg-transparent')}>
            {typesData.map((ele, idx) => (
              <div
                className={cn(
                  'flex cursor-pointer items-center gap-4 border-b border-neutral-700 p-6 first:rounded-t-xl last:rounded-b-xl last:border-0 hover:bg-neutral-950/20',
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
      {/* isAutomation: is automation if status is not no or canceled */}
      {type === ManageTypes.lock && (
        <LockManage
          selected={veTHE}
          theAsset={theAsset}
          updateVeTHEs={updateVeTHEs}
          isAutomation={status !== AUTOMATION_STATUS.NO && status !== AUTOMATION_STATUS.CANCELED}
        />
      )}
      {type === ManageTypes.merge && (
        <MergeManage
          selected={veTHE}
          status={status}
          contract={contractData}
          mutateAutomationData={mutateAutomationData}
        />
      )}
      {type === ManageTypes.split && (
        <SplitManage
          selected={veTHE}
          setPopup={setPopup}
          updateVeTHEs={updateVeTHEs}
          status={status}
          contract={contractData}
          mutateAutomationData={mutateAutomationData}
        />
      )}
      {type === ManageTypes.transfer && (
        <TransferManage
          selected={veTHE}
          setPopup={setPopup}
          updateVeTHEs={updateVeTHEs}
          status={status}
          contract={contractData}
          mutateAutomationData={mutateAutomationData}
        />
      )}
    </Modal>
  )
}
