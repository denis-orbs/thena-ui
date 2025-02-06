import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'

import { TertiaryButton } from '@/components/buttons/Button'
import Dropdown from '@/components/dropdown'
import Skeleton from '@/components/skeleton'
import { ACTION_AUTOMATION_TYPE, AUTOMATION_STATUS } from '@/constant'
import { useAutomationContractDetail, useAutomationStatus } from '@/hooks/automationContract/useAutomationContract'
import useWallet from '@/hooks/useWallet'
import { createVeTHEAutomationContract, setSelectedVeTHE } from '@/state/veTHEAutomationContract/action'

import ConfirmAutomationModal from './ConfirmAutomationModal'
import DepositFundsModal from './Edits/DepositFundsModal'
import EditGasLimitModal from './Edits/EditGasLimitModal'
import EditMaxGasPriceModal from './Edits/EditMaxGasPriceModal'
import ChainlinkModal from './head/ChainlinkModal'
import WithdrawFundsModal from './WithdrawFundsModal'

function AutomationButton({ veTHE, isDetail = false }) {
  const { id: veTHEId, lockedEnd } = veTHE

  const { isLoading, status, mutateData: mutateDataStatus } = useAutomationStatus(veTHEId)
  const { contractData, mutateAutomationData } = useAutomationContractDetail(veTHEId)

  const t = useTranslations()
  const dispatch = useDispatch()

  const { chainId } = useWallet()

  const [showModal, setShowModal] = useState(false)
  const [chainLINKPopup, setChainLINKPopup] = useState(false)
  const [gasLimitPopup, setGasLimitPopup] = useState(false)
  const [depositFundsPopup, setDepositFundsPopup] = useState(false)
  const [withdrawFundsPopup, setWithdrawFundsPopup] = useState(false)
  const [maxGasPricePopup, setMaxGasPricePopup] = useState(false)

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
      [ACTION_AUTOMATION_TYPE.EDIT_GAS_LIMIT]: {
        label: 'Edit gas limit',
        id: veTHEId,
        type: ACTION_AUTOMATION_TYPE.EDIT_GAS_LIMIT,
      },
      [ACTION_AUTOMATION_TYPE.EDIT_MAX_GAS_PRICE]: {
        label: 'Edit max gas price',
        id: veTHEId,
        type: ACTION_AUTOMATION_TYPE.EDIT_MAX_GAS_PRICE,
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

    if (status === AUTOMATION_STATUS.ACTIVE) {
      return [
        options[ACTION_AUTOMATION_TYPE.DEPOSIT_FUNDS],
        options[ACTION_AUTOMATION_TYPE.EDIT_SETTINGS],
        options[ACTION_AUTOMATION_TYPE.EDIT_GAS_LIMIT],
        options[ACTION_AUTOMATION_TYPE.EDIT_MAX_GAS_PRICE],
        ...(isDetail ? [] : [options[ACTION_AUTOMATION_TYPE.DETAIL]]),
        options[ACTION_AUTOMATION_TYPE.PAUSE],
        options[ACTION_AUTOMATION_TYPE.CANCEL],
      ].filter(Boolean)
    }

    if (status === AUTOMATION_STATUS.PENDING) {
      return [
        options[ACTION_AUTOMATION_TYPE.REGISTER_AUTOMATION],
        ...(isDetail ? [] : [options[ACTION_AUTOMATION_TYPE.DETAIL]]),
      ].filter(Boolean)
    }

    if (status === AUTOMATION_STATUS.PAUSED) {
      return [
        options[ACTION_AUTOMATION_TYPE.DEPOSIT_FUNDS],
        options[ACTION_AUTOMATION_TYPE.EDIT_SETTINGS],
        options[ACTION_AUTOMATION_TYPE.EDIT_GAS_LIMIT],
        options[ACTION_AUTOMATION_TYPE.EDIT_MAX_GAS_PRICE],
        ...(isDetail ? [] : [options[ACTION_AUTOMATION_TYPE.DETAIL]]),
        options[ACTION_AUTOMATION_TYPE.UNPAUSE],
        options[ACTION_AUTOMATION_TYPE.CANCEL],
      ].filter(Boolean)
    }
    if (status === AUTOMATION_STATUS.CANCELED) {
      return [
        options[ACTION_AUTOMATION_TYPE.WITHDRAW_FUNDS],
        ...(isDetail ? [] : [options[ACTION_AUTOMATION_TYPE.DETAIL]]),
      ].filter(Boolean)
    }
  }, [isDetail, status, veTHEId])

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
  }, [action, chainId, contractData.address])

  return (
    <>
      {isLoading ? (
        <Skeleton className='h-11 w-full rounded-xl' />
      ) : (
        <>
          {(status === AUTOMATION_STATUS.NO || status === AUTOMATION_STATUS.UNKNOWN) && (
            <TertiaryButton
              disabled={nowInSeconds >= lockedEnd}
              className='w-full py-3 lg:px-1'
              onClick={onClickAddAutomation}
            >
              {t('Add Automation')}
            </TertiaryButton>
          )}

          {status !== AUTOMATION_STATUS.NO && (
            <>
              <Dropdown
                placeHolder={t('Automation')}
                className='h-11 w-full'
                data={actions || []}
                setSelected={data => {
                  setAction(data)
                  setActionConfirm(data)
                }}
              />
            </>
          )}
        </>
      )}
      <ConfirmAutomationModal
        actionType={actionConfirm?.type}
        address={contractData.address}
        mutateAutomationData={() => {
          mutateAutomationData()
          mutateDataStatus()
        }}
        showModal={showModal}
        setShowModal={setShowModal}
      />
      <ChainlinkModal
        tokenId={veTHEId}
        address={contractData.address}
        mutateAutomationData={() => {
          mutateAutomationData()
          mutateDataStatus()
        }}
        popup={chainLINKPopup}
        setPopup={setChainLINKPopup}
      />
      <EditGasLimitModal contract={contractData} popup={gasLimitPopup} setPopup={setGasLimitPopup} />
      <DepositFundsModal contract={contractData} popup={depositFundsPopup} setPopup={setDepositFundsPopup} />
      <WithdrawFundsModal contract={contractData} popup={withdrawFundsPopup} setPopup={setWithdrawFundsPopup} />
      <EditMaxGasPriceModal contract={contractData} popup={maxGasPricePopup} setPopup={setMaxGasPricePopup} />
    </>
  )
}

export default AutomationButton
