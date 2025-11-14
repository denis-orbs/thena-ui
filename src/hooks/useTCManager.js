import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256, parseEventLogs } from 'viem'

import tcManagerAbi from '@/abis/core/tcManager.json'
import { useTC } from '@/app/arena/TCContext'
import { DEPOSIT_TYPE, TC_MARKET_TYPES, TXN_STATUS } from '@/constant'
import useWallet from '@/hooks/useWallet'
import { readCall, waitCall } from '@/lib/contractActions'
import { getERC20Contract, getTCContract, getTCPerpetualManagerContract } from '@/lib/contracts'
import { fromWei } from '@/lib/utils'
import { useTxn } from '@/state/transactions/hooks'

export const useCreateTC = () => {
  const [pending, setPending] = useState(false)
  const { startTxn, endTxn, writeTxn } = useTxn()
  const { account, chainId } = useWallet()
  const { protocolFeeToken, protocolFee, protocolFeePerpetual, protocolFeeTokenPerpetual } = useTC()
  const t = useTranslations()

  const handleCreate = useCallback(
    async data => {
      const key = uuidv4()
      const approveFeeuuid = uuidv4()
      const createuuid = uuidv4()
      // Check if is Perpetual TC
      const isPerpetualTC = data?.market === TC_MARKET_TYPES.PERPETUAL
      console.log({ isPerpetualTC })
      const tcManagerContract = isPerpetualTC ? getTCPerpetualManagerContract() : getTCContract()
      const tokenContract = getERC20Contract(
        isPerpetualTC ? protocolFeeTokenPerpetual?.address : protocolFeeToken?.address,
        chainId,
      )
      const allowance = await readCall(tokenContract, 'allowance', [account, tcManagerContract.address])
      const isApprovedFee = fromWei(allowance).gte(fromWei(isPerpetualTC ? protocolFeePerpetual : protocolFee))

      startTxn({
        key,
        title: 'Create Trading Competition',
        transactions: {
          ...(!isApprovedFee && {
            [approveFeeuuid]: {
              desc: `${t('Approve')} ${t('Fee')}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [createuuid]: {
            desc: t('Create Trading Competition'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      setPending(true)

      if (!isApprovedFee) {
        const isSuccess = await writeTxn(key, approveFeeuuid, tokenContract, 'approve', [
          tcManagerContract.address,
          maxUint256,
        ])
        if (!isSuccess) {
          setPending(false)
          return false
        }
      }

      let competitionRules = {}

      if (isPerpetualTC) {
        competitionRules = {
          ...competitionRules,
          starting_balance: data.competitionRules.startingBalance,
          pairIds: data.competitionRules.pairIds,
        }
      } else {
        competitionRules = {
          ...competitionRules,
          winning_token: data.competitionRules.winningToken.address,
          tradingTokens: data.competitionRules.tradingTokens.map(ele => ele.address),
          starting_balance: data.depositType === DEPOSIT_TYPE.FREE ? 0 : data.competitionRules.startingBalance,
          minimum_balance: data.depositType === DEPOSIT_TYPE.FREE ? data.competitionRules.minimumBalance : 0,
        }
      }

      const tradingComp = {
        id: isPerpetualTC ? 0 : undefined,
        entryFee: data.entryFee,
        MAX_PARTICIPANTS: data.maxParticipants,
        owner: data.owner.id,
        tradingCompetition: data.tcAddress,
        name: data.name,
        description: data.description,
        market: isPerpetualTC ? undefined : 0,
        timestamp: {
          ...data.timestamp,
        },
        competitionRules,
        prize: {
          win_type: data.winType,
          weights: data.prize.weights,
          totalPrize: data.prize.totalPrize,
          owner_fee: data.prize.ownerFee,
          token: data.prize.token.map(token => token.address),
        },
      }

      console.log({ tradingComp })

      const isSuccess = await writeTxn(key, createuuid, tcManagerContract, 'create', [tradingComp])
      if (!isSuccess) {
        setPending(false)
        return false
      }

      endTxn({
        key,
        final: 'TC Create Successful',
      })

      setPending(false)
      return isSuccess
    },
    [
      protocolFeeTokenPerpetual?.address,
      chainId,
      protocolFeeToken?.address,
      account,
      protocolFeePerpetual,
      protocolFee,
      startTxn,
      t,
      writeTxn,
      endTxn,
    ],
  )

  const handleGetTCId = useCallback(async txHash => {
    const txnReceipt = await waitCall(txHash)
    const eventLogs = parseEventLogs({
      abi: tcManagerAbi,
      eventName: 'Create',
      logs: txnReceipt.logs,
    })
    if (eventLogs && eventLogs.length > 0) {
      const parsed = eventLogs[0]
      if (parsed.args) {
        const { idCounter, competition: comp } = parsed.args
        if (comp && (idCounter === 0n || idCounter)) {
          const id = new BigNumber(idCounter).toNumber()
          if (id === 0 || id) {
            return `${comp.toLowerCase()}-${id}`
          }
        }
      }
    }

    return ''
  }, [])

  return { onCreate: handleCreate, pending, handleGetTCId }
}
