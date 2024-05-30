import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256 } from 'viem'

import { TC_MARKET_TYPES, TXN_STATUS } from '@/constant'
import { tcManagerAbi } from '@/constant/abi/core'
import { useTC } from '@/context/tcContext'
import { readCall, waitCall } from '@/lib/contractActions'
import { getERC20Contract, getTCContract, getTCPerpetualManagerContract } from '@/lib/contracts'
import { fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { useTxn } from '@/state/transactions/hooks'

export const useCreateTC = () => {
  const [pending, setPending] = useState(false)
  const { startTxn, endTxn, writeTxn } = useTxn()
  const { account, chainId } = useWallet()
  const { protocolFeeToken, protocolFee } = useTC()
  const t = useTranslations()

  const handleCreate = useCallback(
    async data => {
      const key = uuidv4()
      const approveFeeuuid = uuidv4()
      const approveHostuuid = uuidv4()
      const createuuid = uuidv4()
      // Check if is Perpetual TC
      const isPerpetualTC = data?.market === TC_MARKET_TYPES.PERPETUAL
      console.log({ isPerpetualTC })
      const tcManagerContract = isPerpetualTC ? getTCPerpetualManagerContract() : getTCContract()
      const tokenContract = getERC20Contract(protocolFeeToken?.address, chainId)
      const allowance = await readCall(tokenContract, 'allowance', [account, tcManagerContract.address])
      const isApprovedFee = fromWei(allowance).gte(fromWei(protocolFee))

      if (isPerpetualTC) {
        // TODO: Only for testing
        const MockUSDAddress = '0xced4aC14bB1077B995b954C48a87b25EBb4828E5'
        data.prize.token.address = MockUSDAddress
      }

      let prizeTokenContract = null
      let allowanceHost = 0n
      let isApprovedHost = true
      if (data?.prize?.hostContribution) {
        prizeTokenContract = getERC20Contract(data.prize.token.address, chainId)
        allowanceHost = await readCall(prizeTokenContract, 'allowance', [account, tcManagerContract.address])
        isApprovedHost = fromWei(allowanceHost).gte(fromWei(data.prize.hostContribution))
      }

      startTxn({
        key,
        title: t('Create Trading Competition'),
        transactions: {
          ...(!isApprovedFee && {
            [approveFeeuuid]: {
              desc: `${t('Approve')} ${t('Fee')}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          ...(!isApprovedHost && {
            [approveHostuuid]: {
              desc: `${t('Approve')} Host`,
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

      if (!isApprovedHost) {
        const isSuccess = await writeTxn(key, approveHostuuid, prizeTokenContract, 'approve', [
          tcManagerContract.address,
          maxUint256,
        ])
        if (!isSuccess) {
          setPending(false)
          return false
        }
      }

      let competitionRules = {
        starting_balance: data.competitionRules.startingBalance,
      }

      if (isPerpetualTC) {
        competitionRules = {
          ...competitionRules,
          // TODO: Hardcode
          pairIds: [1, 2, 3, 4],
        }
      } else {
        competitionRules = {
          ...competitionRules,
          winning_token: data.competitionRules.winningToken.address,
          tradingTokens: data.competitionRules.tradingTokens.map(ele => ele.address),
        }
      }

      const tradingComp = {
        id: isPerpetualTC ? 0 : undefined,
        entryFee: data.entryFee,
        MAX_PARTICIPANTS: data.maxParticipants,
        owner: data.owner.id,
        tradingCompetition: data.tradingCompetitionSpot,
        name: data.name,
        description: data.description,
        market: isPerpetualTC ? undefined : 0,
        timestamp: {
          ...data.timestamp,
        },
        competitionRules,
        prize: {
          win_type: false,
          weights: data.prize.weights,
          totalPrize: data.prize.totalPrize,
          owner_fee: data.prize.ownerFee,
          token: isPerpetualTC ? data.prize.token.address : data.prize.token.map(token => token.address),
          host_contribution: data.prize.hostContribution,
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
    [protocolFeeToken?.address, chainId, account, protocolFee, startTxn, t, writeTxn, endTxn],
  )

  const handleGetTCId = useCallback(async txHash => {
    const txnReceipt = await waitCall(txHash)
    const iface = new ethers.Interface(tcManagerAbi)
    for (let i = 0; i < txnReceipt.logs.length; i++) {
      const parsed = iface.parseLog(txnReceipt.logs[i])
      if (parsed && parsed.name === 'Create') {
        if (parsed.args) {
          const idCounter = parsed.args.getValue('idCounter')
          const comp = parsed.args.getValue('competition')
          if (comp && (idCounter === 0n || idCounter)) {
            const id = new BigNumber(idCounter).toNumber()
            if (id === 0 || id) {
              return `${comp.toLowerCase()}-${id}`
            }
          }
        }
      }
    }

    return ''
  }, [])

  return { onCreate: handleCreate, pending, handleGetTCId }
}
