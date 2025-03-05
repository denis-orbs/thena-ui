import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { TertiaryButton } from '@/components/buttons/Button'
import Dropdown from '@/components/dropdown'
import ConfirmModal from '@/components/modal/ConfirmModal'
import Skeleton from '@/components/skeleton'
import { ACTION_AUTOMATION_TYPE, AUTOMATION_STATUS } from '@/constant'
import { useAutomationContractDetail, useVeTheAutomations } from '@/hooks/automationContract/useAutomationContract'
import useWallet from '@/hooks/useWallet'
import { cn } from '@/lib/utils'

import ConfirmAutomationModal from './ConfirmAutomationModal'
import DepositFundsModal from './Edits/DepositFundsModal'
import EditExecutionTimeModal from './Edits/EditExecutionTimeModal'
import EditGasLimitModal from './Edits/EditGasLimitModal'
import EditMaxGasPriceModal from './Edits/EditMaxGasPriceModal'
import ChainlinkModal from './head/ChainlinkModal'
import WithdrawFundsModal from './WithdrawFundsModal'

function AutomationButton({ veTHE, isDetail = false, className }) {
  const { id: veTHEId, lockedEnd } = veTHE

  const { data: veTHEs, isLoading, refetch: refetchAutomations } = useVeTheAutomations()
  const found = veTHEs?.find(item => item.id === veTHEId)
  const status = found?.statusString || AUTOMATION_STATUS.NO
  const { contractData, mutateAutomationData } = useAutomationContractDetail(veTHEId)

  const t = useTranslations()

  const { chainId } = useWallet()

  const [showModal, setShowModal] = useState(false)
  const [chainLINKPopup, setChainLINKPopup] = useState(false)
  const [gasLimitPopup, setGasLimitPopup] = useState(false)
  const [depositFundsPopup, setDepositFundsPopup] = useState(false)
  const [withdrawFundsPopup, setWithdrawFundsPopup] = useState(false)
  const [maxGasPricePopup, setMaxGasPricePopup] = useState(false)
  const [executionTimePopup, setExecutionTimePopup] = useState(false)
  const [warnClaimReward, setWarnClaimReward] = useState(false)

  const nowInSeconds = Math.floor(Date.now() / 1000)

  const [action, setAction] = useState()
  const [actionConfirm, setActionConfirm] = useState()

  const { push } = useRouter()

  const actions = useMemo(() => {
    const options = {
      [ACTION_AUTOMATION_TYPE.DEPOSIT_FUNDS]: {
        label: 'Deposit Funds',
        id: veTHEId,
        type: ACTION_AUTOMATION_TYPE.DEPOSIT_FUNDS,
      },
      [ACTION_AUTOMATION_TYPE.DETAIL]: {
        label: 'Automation Details',
        id: veTHEId,
        type: ACTION_AUTOMATION_TYPE.DETAIL,
      },
      [ACTION_AUTOMATION_TYPE.EDIT_SETTINGS]: {
        label: 'Edit Settings',
        id: veTHEId,
        type: ACTION_AUTOMATION_TYPE.EDIT_SETTINGS,
      },
      [ACTION_AUTOMATION_TYPE.EDIT_EXECUTION_TIME]: {
        label: 'Edit Execution Time',
        id: veTHEId,
        type: ACTION_AUTOMATION_TYPE.EDIT_EXECUTION_TIME,
      },
      [ACTION_AUTOMATION_TYPE.EDIT_GAS_LIMIT]: {
        label: 'Edit gas limit',
        id: veTHEId,
        type: ACTION_AUTOMATION_TYPE.EDIT_GAS_LIMIT,
      },
      [ACTION_AUTOMATION_TYPE.REGISTER_AUTOMATION]: {
        label: 'Register Automation',
        id: veTHEId,
        type: ACTION_AUTOMATION_TYPE.REGISTER_AUTOMATION,
      },
      [ACTION_AUTOMATION_TYPE.PAUSE]: {
        label: 'Pause Automation',
        id: veTHEId,
        type: ACTION_AUTOMATION_TYPE.PAUSE,
      },
      [ACTION_AUTOMATION_TYPE.CANCEL]: {
        label: 'Cancel Automation',
        id: veTHEId,
        type: ACTION_AUTOMATION_TYPE.CANCEL,
      },
      [ACTION_AUTOMATION_TYPE.UNPAUSE]: {
        label: 'Unpause Automation',
        id: veTHEId,
        type: ACTION_AUTOMATION_TYPE.UNPAUSE,
      },
      [ACTION_AUTOMATION_TYPE.CREATE]: {
        label: 'Create New Automation',
        id: veTHEId,
        type: ACTION_AUTOMATION_TYPE.CREATE,
      },
      [ACTION_AUTOMATION_TYPE.WITHDRAW_FUNDS]: {
        label: 'Withdraw Funds',
        id: veTHEId,
        type: ACTION_AUTOMATION_TYPE.WITHDRAW_FUNDS,
      },
    }

    const getActionsByStatus = {
      [AUTOMATION_STATUS.ACTIVE]: [
        ACTION_AUTOMATION_TYPE.DEPOSIT_FUNDS,
        ACTION_AUTOMATION_TYPE.EDIT_SETTINGS,
        ACTION_AUTOMATION_TYPE.EDIT_EXECUTION_TIME,
        ACTION_AUTOMATION_TYPE.EDIT_GAS_LIMIT,
        ...(isDetail ? [] : [ACTION_AUTOMATION_TYPE.DETAIL]),
        ACTION_AUTOMATION_TYPE.PAUSE,
        ACTION_AUTOMATION_TYPE.CANCEL,
      ],
      [AUTOMATION_STATUS.PENDING]: [
        ACTION_AUTOMATION_TYPE.REGISTER_AUTOMATION,
        ...(isDetail ? [] : [ACTION_AUTOMATION_TYPE.DETAIL]),
      ],
      [AUTOMATION_STATUS.PAUSED]: [
        ACTION_AUTOMATION_TYPE.DEPOSIT_FUNDS,
        ACTION_AUTOMATION_TYPE.EDIT_SETTINGS,
        ACTION_AUTOMATION_TYPE.EDIT_EXECUTION_TIME,
        ACTION_AUTOMATION_TYPE.EDIT_GAS_LIMIT,
        ...(isDetail ? [] : [ACTION_AUTOMATION_TYPE.DETAIL]),
        ACTION_AUTOMATION_TYPE.UNPAUSE,
        ACTION_AUTOMATION_TYPE.CANCEL,
      ],
      [AUTOMATION_STATUS.CANCELED]: [
        ACTION_AUTOMATION_TYPE.WITHDRAW_FUNDS,
        ...(isDetail ? [] : [ACTION_AUTOMATION_TYPE.DETAIL]),
      ],
    }

    const statusActions = getActionsByStatus[status] || []
    return statusActions.map(actionType => options[actionType])
  }, [isDetail, status, veTHEId])

  const onClickAddAutomation = useCallback(() => {
    if (veTHE) {
      if (veTHE?.rebase_amount.gt(0)) {
        setWarnClaimReward(true)
        return
      }
      push(`/dashboard/lock/automation/${veTHE.id}/create`)
    }
  }, [push, veTHE])

  useEffect(() => {
    if (!action) return

    if (action.type === ACTION_AUTOMATION_TYPE.DETAIL) {
      push(`/dashboard/lock/automation/${action.id}`)
    }

    if (action.type === ACTION_AUTOMATION_TYPE.EDIT_SETTINGS) {
      push(`/dashboard/lock/automation/${action.id}/edit`)
    }

    if (action.type === ACTION_AUTOMATION_TYPE.CREATE) {
      onClickAddAutomation()
    }
  }, [action, chainId, contractData.address, onClickAddAutomation, push, veTHE])

  useEffect(() => {
    if (!action) return

    if (
      action.type === ACTION_AUTOMATION_TYPE.CANCEL ||
      action.type === ACTION_AUTOMATION_TYPE.PAUSE ||
      action.type === ACTION_AUTOMATION_TYPE.UNPAUSE
    ) {
      setShowModal(true)
      setAction()
    }

    if (action.type === ACTION_AUTOMATION_TYPE.REGISTER_AUTOMATION) {
      setChainLINKPopup(true)
      setAction()
    }

    if (action.type === ACTION_AUTOMATION_TYPE.EDIT_GAS_LIMIT) {
      setGasLimitPopup(true)
      setAction()
    }

    if (action.type === ACTION_AUTOMATION_TYPE.DEPOSIT_FUNDS) {
      setDepositFundsPopup(true)
      setAction()
    }

    if (action.type === ACTION_AUTOMATION_TYPE.EDIT_MAX_GAS_PRICE) {
      setMaxGasPricePopup(true)
      setAction()
    }

    if (action.type === ACTION_AUTOMATION_TYPE.WITHDRAW_FUNDS) {
      setWithdrawFundsPopup(true)
      setAction()
    }

    if (action.type === ACTION_AUTOMATION_TYPE.EDIT_EXECUTION_TIME) {
      setExecutionTimePopup(true)
      setAction()
    }
  }, [action, chainId, contractData.address])

  return (
    <>
      {isLoading ? (
        <Skeleton className={('h-11 w-full rounded-xl', className)} />
      ) : (
        <>
          {status === AUTOMATION_STATUS.NO || (status === AUTOMATION_STATUS.CANCELED && contractData.balance === 0) ? (
            <TertiaryButton
              disabled={nowInSeconds >= lockedEnd}
              className={cn('w-full min-w-fit py-3 lg:px-1', className)}
              onClick={onClickAddAutomation}
            >
              {t('Add Automation')}
            </TertiaryButton>
          ) : (
            <Dropdown
              placeHolder={t('Automation')}
              className={cn('h-11 w-full', className)}
              data={actions || []}
              setSelected={data => {
                setAction(data)
                setActionConfirm(data)
              }}
              listClassNames='w-[240px]'
            />
          )}
        </>
      )}
      {warnClaimReward && (
        <ConfirmModal
          setPopup={setWarnClaimReward}
          bgIcon='bg-error-600'
          popup={warnClaimReward}
          cancelButton={t('Cancel')}
          confirmButton={t('OK')}
          title={t('Warning')}
          desc={t('You need to claim your rebase first')}
          onConfirm={() => {
            push('/dashboard/rewards')
            setWarnClaimReward(false)
          }}
        />
      )}
      {showModal && (
        <ConfirmAutomationModal
          actionType={actionConfirm?.type}
          address={contractData.address}
          mutateAutomationData={() => {
            mutateAutomationData()
            refetchAutomations()
          }}
          showModal={showModal}
          setShowModal={setShowModal}
        />
      )}
      {chainLINKPopup && (
        <ChainlinkModal
          tokenId={veTHEId}
          address={contractData.address}
          mutateAutomationData={() => {
            mutateAutomationData()
            refetchAutomations()
          }}
          popup={chainLINKPopup}
          setPopup={setChainLINKPopup}
        />
      )}
      {gasLimitPopup && <EditGasLimitModal contract={contractData} popup={gasLimitPopup} setPopup={setGasLimitPopup} />}
      {depositFundsPopup && (
        <DepositFundsModal contract={contractData} popup={depositFundsPopup} setPopup={setDepositFundsPopup} />
      )}
      {withdrawFundsPopup && (
        <WithdrawFundsModal contract={contractData} popup={withdrawFundsPopup} setPopup={setWithdrawFundsPopup} />
      )}
      {maxGasPricePopup && (
        <EditMaxGasPriceModal contract={contractData} popup={maxGasPricePopup} setPopup={setMaxGasPricePopup} />
      )}
      {executionTimePopup && (
        <EditExecutionTimeModal contract={contractData} popup={executionTimePopup} setPopup={setExecutionTimePopup} />
      )}
    </>
  )
}

export default AutomationButton
