import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256 } from 'viem'

import { TXN_STATUS } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { readCall } from '@/lib/contractActions'
import { getERC20Contract, getTCContract } from '@/lib/contracts'
import { fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { useTxn } from '@/state/transactions/hooks'

export const useTCManagerInfo = () => {
  const [protocolFee, setProtocolFee] = useState()
  const [protocolFeeToken, setProtocolFeeToken] = useState(false)
  const [tradingTokens, setTradingTokens] = useState([])
  const [isAllowed, setIsAllowed] = useState(false)
  const { account } = useWallet()
  const assets = useAssets()

  useEffect(() => {
    const fetchTotalInfo = async () => {
      const tcManagerContract = getTCContract()
      const [res0, res1, res2, res3, res4] = await Promise.all([
        readCall(tcManagerContract, 'isPermissionless', []),
        readCall(tcManagerContract, 'protocol_fee', []),
        readCall(tcManagerContract, 'protocol_fee_token', []),
        readCall(tcManagerContract, 'tradingTokens', []),
        readCall(tcManagerContract, 'isAllowedCreator', [account]),
      ])
      const tradeAssets = assets.filter(ele => res3.map(sub => sub.toLowerCase()).includes(ele.address))
      const feeToken = assets.find(ele => ele.address.toLowerCase() === res2.toLowerCase())
      setProtocolFee(res1)
      setProtocolFeeToken(feeToken)
      setTradingTokens(tradeAssets)
      // setIsAllowed(res0 || res4)
      // TODO: Just for test
      setIsAllowed(true)
    }

    if (account && assets.length > 0 && tradingTokens.length === 0) {
      fetchTotalInfo()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, assets])

  return { isAllowed, protocolFee, protocolFeeToken, tradingTokens }
}

export const useCreateTC = () => {
  const [pending, setPending] = useState(false)
  const { startTxn, endTxn, writeTxn } = useTxn()
  const { account, chainId } = useWallet()
  const { protocolFeeToken, protocolFee } = useTCManagerInfo()
  const t = useTranslations()

  const handleCreate = useCallback(
    async data => {
      const key = uuidv4()
      const approveFeeuuid = uuidv4()
      const approveHostuuid = uuidv4()
      const createuuid = uuidv4()
      const tcManagerContract = getTCContract()

      const tokenContract = getERC20Contract(protocolFeeToken.address, chainId)
      const allowance = await readCall(tokenContract, 'allowance', [account, tcManagerContract.address])
      const isApprovedFee = fromWei(allowance).gte(fromWei(protocolFee))

      const prizeTokenContract = getERC20Contract(data.prize.token.address, chainId)
      const allowanceHost = await readCall(prizeTokenContract, 'allowance', [account, tcManagerContract.address])
      const isApprovedHost = fromWei(allowanceHost).gte(fromWei(data.prize.hostContribution))

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
          return
        }
      }

      if (!isApprovedHost) {
        const isSuccess = await writeTxn(key, approveHostuuid, prizeTokenContract, 'approve', [
          tcManagerContract.address,
          maxUint256,
        ])
        if (!isSuccess) {
          setPending(false)
          return
        }
      }

      const tradingComp = {
        entryFee: data.entryFee,
        MAX_PARTICIPANTS: data.maxParticipants,
        owner: data.owner.id,
        tradingCompetition: data.tradingCompetitionSpot,
        name: data.name,
        description: data.description,
        market: 0,
        timestamp: {
          ...data.timestamp,
        },
        competitionRules: {
          starting_balance: data.competitionRules.startingBalance,
          winning_token: data.competitionRules.winningToken.address,
          tradingTokens: data.competitionRules.tradingTokens.map(ele => ele.address),
        },
        prize: {
          win_type: false,
          weights: data.prize.weights,
          totalPrize: data.prize.totalPrize,
          owner_fee: data.prize.ownerFee,
          token: data.prize.token.address,
          host_contribution: data.prize.hostContribution,
        },
      }

      const isSuccess = await writeTxn(key, createuuid, tcManagerContract, 'create', [tradingComp])
      if (!isSuccess) {
        setPending(false)
        return
      }

      endTxn({
        key,
        final: 'TC Create Successful',
      })

      setPending(false)
    },
    [account, chainId, protocolFee, protocolFeeToken.address, endTxn, startTxn, t, writeTxn],
  )

  return { onCreate: handleCreate, pending }
}
