import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256 } from 'viem'

import { TC_MARKET_TYPES, TXN_STATUS } from '@/constant'
import { readCall } from '@/lib/contractActions'
import { getERC20Contract, getTcPerpetualContract } from '@/lib/contracts'
import { fromWei, isInvalidAmount } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { useTxn } from '@/state/transactions/hooks'

export const useTCPerpetualInfor = (tcAddress, type = TC_MARKET_TYPES.PERPETUAL) => {
  const [loaded, setLoaded] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isWinner, setIsWinner] = useState(false)
  const [isOwner, setIsOwner] = useState(false)

  const { account } = useWallet()

  const getUserData = useCallback(async () => {
    setLoaded(false)

    if (tcAddress) {
      if (!account || type !== TC_MARKET_TYPES.PERPETUAL) {
        setIsRegistered(false)
        setIsWinner(false)
        setIsOwner(false)
        setLoaded(true)

        return
      }

      const tcPerpetualContract = getTcPerpetualContract(tcAddress)
      try {
        const res0 = await readCall(tcPerpetualContract, 'isRegistered', [account])
        if (res0) {
          setIsRegistered(true)
        }
      } catch (error) {
        setIsRegistered(false)
      }
      const res1 = await readCall(tcPerpetualContract, 'tradingCompetition', [])
      if (res1 && String(res1.owner).toLowerCase() === account.toLowerCase()) {
        setIsOwner(true)
      }

      setLoaded(true)
    }
  }, [account, tcAddress, type])

  useEffect(() => {
    getUserData()
  }, [getUserData])

  return {
    loaded,
    isRegistered,
    isWinner,
    isOwner,
    refetch: getUserData,
  }
}

export const useJoinTCPerpetual = () => {
  const { startTxn, endTxn, writeTxn, closeTxnModal } = useTxn()
  const { account, chainId } = useWallet()
  const t = useTranslations()
  const [pending, setPending] = useState(false)

  const joinTCPerpetual = useCallback(
    async (data, name) => {
      const key = uuidv4()
      const joinuuid = uuidv4()
      const tcPerpetualContract = getTcPerpetualContract(data.tcAddress)
      const winningTokenContract = getERC20Contract(data.competitionRules.winningToken.address, chainId)

      const tokens = {
        [data.competitionRules.winningToken.address]: {
          amount: fromWei(data.competitionRules.startingBalance),
          decimals: 18,
          symbol: data.competitionRules.winningToken.symbol,
          contract: winningTokenContract,
        },
      }
      const transactions = {}

      for (let i = 0; i < data.entryFeeUpdate.length; i++) {
        if (!isInvalidAmount(data.entryFeeUpdate[i])) {
          if (tokens[data.prizeUpdate.token[i].address]) {
            const feeAmount = fromWei(data.entryFeeUpdate[i], data.prizeUpdate.token[i].decimals).plus(
              tokens[data.prizeUpdate.token[i].address].amount,
            )
            tokens[data.prizeUpdate.token[i].address].amount = feeAmount
          } else {
            const feeTokenContract = getERC20Contract(data.prizeUpdate.token[i].address, chainId)
            tokens[data.prizeUpdate.token[i].address] = {
              amount: fromWei(data.entryFeeUpdate[i], data.prizeUpdate.token[i].decimals),
              decimals: data.prizeUpdate.token[i].decimals,
              symbol: data.prizeUpdate.token[i].symbol,
              contract: feeTokenContract,
            }
          }
        }
      }

      for (let i = 0; i < Object.keys(tokens).length; i++) {
        const address = Object.keys(tokens)[i]
        const approveFeeuuid = uuidv4()
        const allowance = await readCall(tokens[address].contract, 'allowance', [account, data.tcAddress])

        const isApprovedFee = fromWei(allowance, tokens[address].decimals).gte(
          tokens[address].amount,
          tokens[address].decimals,
        )

        if (!isApprovedFee) {
          tokens[address].id = approveFeeuuid
          transactions[approveFeeuuid] = {
            desc: `${t('Approve')} ${tokens[address].symbol}`,
            status: TXN_STATUS.START,
            hash: null,
          }
        }
      }
      transactions[joinuuid] = {
        desc: t('Join Competition'),
        status: TXN_STATUS.START,
        hash: null,
      }
      setPending(true)
      startTxn({
        key,
        title: t('Join Competition'),
        transactions,
      })
      for (let i = 0; i < Object.keys(tokens).length; i++) {
        const address = Object.keys(tokens)[i]
        if (tokens[address].id) {
          const isSuccess = await writeTxn(key, tokens[address].id, tokens[address].contract, 'approve', [
            data.tcAddress,
            maxUint256,
          ])

          if (!isSuccess) {
            setPending(false)
            return false
          }
        }
      }

      const isSuccess = await writeTxn(key, joinuuid, tcPerpetualContract, 'addAccount', [name])
      if (!isSuccess) {
        setPending(false)
        return false
      }

      endTxn({
        key,
        final: 'Join TC Successful',
      })
      setPending(false)
      closeTxnModal()
      return true
    },
    [account, chainId, closeTxnModal, endTxn, startTxn, t, writeTxn],
  )

  return {
    pending,
    joinTCPerpetual,
  }
}
