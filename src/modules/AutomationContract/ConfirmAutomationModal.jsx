import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo } from 'react'

import ConfirmModal from '@/components/modal/ConfirmModal'
import { ACTION_AUTOMATION_TYPE } from '@/constant'
import { useCancelAutomation, usePauseAutomation } from '@/hooks/automationContract/useAutomationContract'

function ConfirmAutomationModal({
  actionType,
  address,
  mutateAutomationData,
  setIsPending = () => {},
  showModal = false,
  setShowModal = () => {},
}) {
  const { onPauseAutomation, pending: pendingPause } = usePauseAutomation()
  const { onCancelAutomation, pending: pendingCancel } = useCancelAutomation()

  useEffect(() => {
    setIsPending(pendingCancel || pendingPause)
  }, [pendingCancel, pendingPause, setIsPending])

  const t = useTranslations()

  const textData = useMemo(() => {
    const result = {
      title: `${t('Are You Sure')}?`,
      desc: '',
      confirm: '',
    }
    if (actionType === ACTION_AUTOMATION_TYPE.PAUSE) {
      result.desc = t('Confirm pause automation')
      result.confirm = t('Pause Automation')
    } else if (actionType === ACTION_AUTOMATION_TYPE.UNPAUSE) {
      result.desc = t('Confirm unpause automation')
      result.confirm = t('Unpause Automation')
    } else if (actionType === ACTION_AUTOMATION_TYPE.CANCEL) {
      result.desc = t('Confirm cancel automation')
      result.confirm = t('Cancel Deposit')
    }
    return result
  }, [actionType, t])

  return (
    <ConfirmModal
      onConfirm={() => {
        if (actionType === ACTION_AUTOMATION_TYPE.PAUSE) {
          onPauseAutomation(address, ACTION_AUTOMATION_TYPE.PAUSE, mutateAutomationData)
        } else if (actionType === ACTION_AUTOMATION_TYPE.UNPAUSE) {
          onPauseAutomation(address, ACTION_AUTOMATION_TYPE.UNPAUSE, mutateAutomationData)
        } else if (actionType === ACTION_AUTOMATION_TYPE.CANCEL) {
          onCancelAutomation(address, mutateAutomationData)
        }
      }}
      popup={showModal}
      setPopup={setShowModal}
      cancelButton={t('Close')}
      confirmButton={textData?.confirm}
      title={textData?.title}
      desc={textData?.desc}
    />
  )
}

export default ConfirmAutomationModal
