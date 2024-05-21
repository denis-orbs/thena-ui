import BigNumber from 'bignumber.js'
import { gql } from 'graphql-request'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256 } from 'viem'

import { TXN_STATUS } from '@/constant'
import { readCall } from '@/lib/contractActions'
import { getERC20Contract, getTcPerpetualContract } from '@/lib/contracts'
import { v4Client } from '@/lib/graphql'
import { fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { useTxn } from '@/state/transactions/hooks'

const V4_COMPETITION_BY_ID = gql`
  query V4_COMPETITION_BY_ID($id: String = "") {
    tradingCompetitionById(id: $id) {
      entryFee
      market
      id
      competitionRules {
        winningToken
        startingBalance
      }
      prize {
        token
      }
      participants {
        id
        participant {
          id
        }
      }
      owner {
        id
      }
      tradingCompetitionSpot
    }
  }
`

export const useTCPerpetualInfor = id => {
  const [loaded, setLoaded] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isWinner, setIsWinner] = useState(false)
  const [isOwner, setIsOwner] = useState(false)

  const { account } = useWallet()

  const getUserData = useCallback(async () => {
    setLoaded(false)

    if (id) {
      if (!account) {
        setIsRegistered(false)
        setIsWinner(false)
        setIsOwner(false)
        setLoaded(true)

        return
      }

      const { tradingCompetitionById: tcPerpData } = await v4Client.request(V4_COMPETITION_BY_ID, {
        id,
      })

      // TODO: Get data from smart contract
      if (tcPerpData) {
        const foundUserInTC = tcPerpData.participants.some(item => item.participant.id === account.toLowerCase())
        setIsRegistered(foundUserInTC)
        setIsOwner(tcPerpData.owner.id === account.toLowerCase())
        const tcPerpetualContract = getTcPerpetualContract(tcPerpData.tradingCompetitionSpot)
        try {
          const res0 = await readCall(tcPerpetualContract, 'getAccountOf', [account])
          if (res0) {
            setIsRegistered(true)
          }
        } catch (error) {
          setIsRegistered(false)
        }
        const res1 = await readCall(tcPerpetualContract, 'tradingCompetition', [])
        if (res1 && String(res1.owner).toLowerCase() === account?.toLowerCase()) {
          setIsOwner(true)
        }
      }

      setLoaded(true)
    }
  }, [account, id])

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
      const approveFeeuuid = uuidv4()
      const approveStartuuid = uuidv4()
      const joinuuid = uuidv4()
      const tcPerpetualContract = getTcPerpetualContract(data.tradingCompetitionSpot)

      const feeTokenContract = getERC20Contract(data.prize.token.address, chainId)
      const allowance = await readCall(feeTokenContract, 'allowance', [account, data.tradingCompetitionSpot])
      const isApprovedFee = new BigNumber(data.entryFee).isZero() || fromWei(allowance).gte(data.entryFee)

      const winningTokenContract = getERC20Contract(data.competitionRules.winningToken.address, chainId)
      const allowanceWinningToken = await readCall(winningTokenContract, 'allowance', [
        account,
        data.tradingCompetitionSpot,
      ])
      const isApprovedWinningToken = fromWei(allowanceWinningToken).gte(fromWei(data.competitionRules.startingBalance))

      setPending(true)
      startTxn({
        key,
        title: t('Join Competition'),
        transactions: {
          ...(!isApprovedFee && {
            [approveFeeuuid]: {
              desc: `${t('Approve')} ${t('Fee')}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          ...(!isApprovedWinningToken && {
            [approveStartuuid]: {
              desc: `${t('Approve')} ${t('Winning Token')}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [joinuuid]: {
            desc: t('Join Competition'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      if (!isApprovedFee) {
        const isSuccess = await writeTxn(key, approveFeeuuid, feeTokenContract, 'approve', [
          data.tradingCompetitionSpot,
          maxUint256,
        ])
        if (!isSuccess) {
          setPending(false)
          return false
        }
      }

      if (!isApprovedWinningToken) {
        const isSuccess = await writeTxn(key, approveStartuuid, winningTokenContract, 'approve', [
          data.tradingCompetitionSpot,
          maxUint256,
        ])
        if (!isSuccess) {
          setPending(false)
          return false
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
