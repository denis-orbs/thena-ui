import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import { EmphasisButton, OutlinedButton } from '@/components/buttons/Button'
import Skeleton from '@/components/skeleton'
import { TextHeading } from '@/components/typography'
import { AUTOMATION_STATUS } from '@/constant'
import { useAutomationStatus } from '@/hooks/automationContract/useAutomationContract'
import { EditIcon } from '@/svgs'

import ChainlinkModal from './ChainlinkModal'
import ConfirmAutomationModal from '../ConfirmAutomationModal'

const ACTION_TYPE = {
  PAUSE: 'pause',
  UNPAUSE: 'unpause',
  CANCEL: 'cancel',
}

function Head({ tokenId, address, status, mutateAutomationData = () => {} }) {
  const t = useTranslations()
  const { push } = useRouter()
  const [pending, setPending] = useState(false)
  const [actionType, setActionType] = useState()
  const [showModal, setShowModal] = useState(false)
  const { mutateData: mutateDataStatus } = useAutomationStatus(tokenId)
  const [popup, setPopup] = useState(false)

  return (
    <div className='mt-4 flex flex-col justify-between gap-4 lg:flex-row'>
      {tokenId ? (
        <TextHeading className='font-archia text-3xl lg:text-[40px]'>{`veTHE Automation - ID ${tokenId}`}</TextHeading>
      ) : (
        <Skeleton className='h-8 w-44' />
      )}
      {status !== AUTOMATION_STATUS.CANCELED ? (
        <div className='flex flex-col gap-3 lg:flex-row'>
          {status !== AUTOMATION_STATUS.PENDING ? (
            <div className='order-2 flex  gap-3 lg:order-1'>
              <OutlinedButton
                onClick={() => {
                  setActionType(ACTION_TYPE.CANCEL)
                  setShowModal(true)
                }}
                disabled={!tokenId || pending}
                className='w-1/2 px-2 py-3 lg:min-w-fit'
              >
                {t('Cancel Automation')}
              </OutlinedButton>
              {status !== AUTOMATION_STATUS.PENDING && (
                <EmphasisButton
                  onClick={() => {
                    setActionType(status === AUTOMATION_STATUS.PAUSED ? ACTION_TYPE.UNPAUSE : ACTION_TYPE.PAUSE)
                    setShowModal(true)
                  }}
                  disabled={!tokenId || pending}
                  className='w-1/2 px-3  py-3 lg:min-w-fit'
                >
                  {t(status === AUTOMATION_STATUS.PAUSED ? 'Unpause Automation' : 'Pause Automation')}
                </EmphasisButton>
              )}
            </div>
          ) : (
            <EmphasisButton onClick={() => setPopup(true)} disabled={!tokenId || pending} className='w-full lg:w-fit'>
              {t('Active Automation')}
            </EmphasisButton>
          )}
          <EmphasisButton disabled={!tokenId} className='order-1 lg:order-2' onClick={() => push(`${tokenId}/edit`)}>
            {t('Edit Automation')} <EditIcon className='h-4 w-4' />
          </EmphasisButton>
        </div>
      ) : (
        <OutlinedButton
          onClick={() => push('/dashboard/lock/automation/')}
          className='h-11 w-fit border border-primary-600 p-0 text-primary-600 hover:text-primary-600'
        >
          {t('Create New Automation')}
        </OutlinedButton>
      )}
      <ConfirmAutomationModal
        actionType={actionType}
        address={address}
        mutateAutomationData={() => {
          mutateAutomationData()
          mutateDataStatus()
        }}
        showModal={showModal}
        setIsPending={setPending}
        setShowModal={_ => {
          setActionType()
          setShowModal(false)
        }}
      />
      {/* Input chainLinkAmount */}
      <ChainlinkModal
        tokenId={tokenId}
        address={address}
        mutateAutomationData={() => {
          mutateAutomationData()
          mutateDataStatus()
        }}
        popup={popup}
        setPopup={setPopup}
      />
    </div>
  )
}

export default Head
