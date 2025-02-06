import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'

import { TertiaryButton } from '@/components/buttons/Button'
import Dropdown from '@/components/dropdown'
import Skeleton from '@/components/skeleton'
import { ACTION_AUTOMATION_TYPE, AUTOMATION_STATUS } from '@/constant'
import { useAutomationContractDetail, useAutomationStatus } from '@/hooks/automationContract/useAutomationContract'
import { createVeTHEAutomationContract, setSelectedVeTHE } from '@/state/veTHEAutomationContract/action'

import ConfirmAutomationModal from './ConfirmAutomationModal'

function AutomationButton({ veTHE }) {
  const { id: veTHEId } = veTHE
  const { isLoading, status, mutateData: mutateDataStatus } = useAutomationStatus(veTHEId)
  const t = useTranslations()
  const dispatch = useDispatch()
  const [showModal, setShowModal] = useState(false)

  const { contractData, mutateAutomationData } = useAutomationContractDetail(veTHEId)

  const [action, setAction] = useState()

  const { push } = useRouter()

  const actions = useMemo(() => {
    const options = [
      {
        label: 'Details',
        id: veTHEId,
        type: ACTION_AUTOMATION_TYPE.DETAIL,
      },
      {
        label: 'Edit Automation',
        id: veTHEId,
        type: ACTION_AUTOMATION_TYPE.EDIT,
      },
      {
        label: 'Pause Automation',
        id: veTHEId,
        type: ACTION_AUTOMATION_TYPE.PAUSE,
      },
      {
        label: 'Cancel Automation',
        id: veTHEId,
        type: ACTION_AUTOMATION_TYPE.CANCEL,
      },
      {
        label: 'Unpause Automation',
        id: veTHEId,
        type: ACTION_AUTOMATION_TYPE.UNPAUSE,
      },
      {
        label: 'Create New Automation',
        id: veTHEId,
        type: ACTION_AUTOMATION_TYPE.CREATE,
      },
    ]

    if (status === AUTOMATION_STATUS.ACTIVE || status === AUTOMATION_STATUS.PENDING) {
      return [options[0], options[1], options[2], options[3]]
    }

    if (status === AUTOMATION_STATUS.PAUSED) {
      return [options[0], options[1], options[4], options[3]]
    }
    if (status === AUTOMATION_STATUS.CANCELED) {
      return [options[0], options[5]]
    }
  }, [status, veTHEId])

  const onClickAddAutomation = useCallback(() => {
    if (veTHE) {
      dispatch(
        setSelectedVeTHE({
          veTHESelected: {
            ...veTHE,
            amount: veTHE.amount.toString(),
            rebase_amount: veTHE.rebase_amount.toString(),
            voting_amount: veTHE.voting_amount.toString(),
          },
        }),
      )

      dispatch(
        createVeTHEAutomationContract({
          createData: {
            veTHEId: veTHE.id,
            settings: {
              isClaimEveryWeek: true,
              isRelockEveryWeek: true,
              executionTime: new Date().getTime(),
            },
            votes: {
              isAutoVote: true,
              pairs: [
                {
                  lock: false,
                  weight: 100,
                  pair: undefined,
                },
              ],
            },
          },
        }),
      )
      push('/dashboard/lock/automation/')
    }
  }, [dispatch, push, veTHE])

  useEffect(() => {
    if (!action) return

    if (action.type === ACTION_AUTOMATION_TYPE.DETAIL) {
      push(`/dashboard/lock/automation/${action.id}`)
    }

    if (action.type === ACTION_AUTOMATION_TYPE.EDIT) {
      push(`/dashboard/lock/automation/${action.id}/edit`)
    }

    if (action.type === ACTION_AUTOMATION_TYPE.CREATE) {
      onClickAddAutomation()
    }
  }, [action, onClickAddAutomation, push])

  useEffect(() => {
    if (!action) return

    if (
      action.type === ACTION_AUTOMATION_TYPE.CANCEL ||
      action.type === ACTION_AUTOMATION_TYPE.PAUSE ||
      action.type === ACTION_AUTOMATION_TYPE.UNPAUSE
    ) {
      setShowModal(true)
    }
  }, [action])

  return (
    <>
      {isLoading ? (
        <Skeleton className='h-11 w-full rounded-xl' />
      ) : (
        <>
          {(status === AUTOMATION_STATUS.NO || status === AUTOMATION_STATUS.UNKNOWN) && (
            <TertiaryButton className='w-full p-3' onClick={onClickAddAutomation}>
              {t('Add Automation')}
            </TertiaryButton>
          )}

          {status !== AUTOMATION_STATUS.NO && (
            <>
              <Dropdown
                placeHolder={t('Automation')}
                className='h-11 w-full'
                data={actions || []}
                setSelected={setAction}
              />
            </>
          )}
        </>
      )}
      <ConfirmAutomationModal
        actionType={action?.type}
        address={contractData.address}
        mutateAutomationData={() => {
          mutateAutomationData()
          mutateDataStatus()
        }}
        showModal={showModal}
        setShowModal={setShowModal}
      />
    </>
  )
}

export default AutomationButton
