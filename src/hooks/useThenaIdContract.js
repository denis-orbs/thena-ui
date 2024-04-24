import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { TXN_STATUS } from '@/constant'
import { readCall } from '@/lib/contractActions'
import { getERC20Contract, getThenaIDContract } from '@/lib/contracts'
import { fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { useTxn } from '@/state/transactions/hooks'

const DEFAULT_TRAITS = ['GREEK_GODS', 'FIRST_NAMES', 'LAST_NAMES', 'CHARACTER_SET']
const DEFAULT_PROOFS = []

export const useValidateUserName = () => {
  const [loading, setLoading] = useState(false)
  const validate = useCallback(async username => {
    const contract = getThenaIDContract()
    if (username && contract) {
      try {
        setLoading(true)
        const [available, valid] = await Promise.all([
          readCall(contract, 'isUsernameAvailable', [username]),
          readCall(contract, 'validateUsername', [username]),
        ])
        console.log({
          available,
          valid,
        })
        return {
          available,
          valid,
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
  }, [])

  return { loading, validate }
}

export const useCalculateCost = () => {
  const [loading, setLoading] = useState(false)
  const calculate = useCallback(async (username, tokenAddress) => {
    const contract = getThenaIDContract()
    if (username && contract && tokenAddress) {
      try {
        setLoading(true)
        const length = await readCall(contract, 'getLength', [username])
        const costPerToken = await readCall(contract, 'costPerToken', [tokenAddress])

        if (costPerToken[new BigNumber(length).toNumber() - 1]) {
          return costPerToken[new BigNumber(length).toNumber() - 1]
        }
        return undefined
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
  }, [])

  return { loading, calculate }
}

export const useMintThenaId = () => {
  const [loading, setLoading] = useState(false)
  const t = useTranslations()
  const { startTxn, endTxn, writeTxn, closeTxnModal } = useTxn()
  const { account, chainId } = useWallet()

  const buyThenaId = useCallback(
    async (username, tokenAddress, estimateCost) => {
      const thenaIdContract = getThenaIDContract()
      if (username && thenaIdContract && tokenAddress) {
        const key = uuidv4()
        const mintUuid = uuidv4()
        const approveTokenUuid = uuidv4()
        const tokenContract = getERC20Contract(tokenAddress, chainId)
        const allowance = await readCall(tokenContract, 'allowance', [account, thenaIdContract.address])
        const isApprovedToken = fromWei(allowance).gte(fromWei(estimateCost))

        setLoading(true)
        startTxn({
          key,
          title: t('Mint Thena Id'),
          transactions: {
            ...(!isApprovedToken && {
              [approveTokenUuid]: {
                desc: `${t('Approve')} ${t('Token')}`,
                status: TXN_STATUS.START,
                hash: null,
              },
            }),
            [mintUuid]: {
              desc: t('Mint Thena Id'),
              status: TXN_STATUS.START,
              hash: null,
            },
          },
        })

        if (!isApprovedToken) {
          const isSuccess = await writeTxn(key, approveTokenUuid, tokenContract, 'approve', [
            thenaIdContract.address,
            estimateCost,
          ])
          if (!isSuccess) {
            setLoading(false)
            return false
          }
        }

        const isSuccess = await writeTxn(key, mintUuid, thenaIdContract, 'mintUsername', [
          username,
          tokenAddress,
          DEFAULT_TRAITS,
          DEFAULT_PROOFS,
        ])
        if (!isSuccess) {
          setLoading(false)
          return false
        }
        endTxn({
          key,
          final: 'Mint Thena Id Successful',
        })
        setLoading(false)
        closeTxnModal()
        return isSuccess
      }
    },
    [account, chainId, closeTxnModal, endTxn, startTxn, t, writeTxn],
  )

  return { loading, buyThenaId }
}

export const useGiftThenaId = () => {
  const [loading, setLoading] = useState(false)
  const t = useTranslations()
  const { startTxn, endTxn, writeTxn, closeTxnModal } = useTxn()
  const giftThenaId = useCallback(
    async (username, toAddress, tokenAddress) => {
      const contract = getThenaIDContract()
      if (username && contract && tokenAddress) {
        const key = uuidv4()
        const mintUuid = uuidv4()
        const allowedUuid = uuidv4()
        const allowedToken = await readCall(contract, 'allowedTokens', [tokenAddress])

        setLoading(true)
        startTxn({
          key,
          title: t('Send As Gift'),
          transactions: {
            ...(!allowedToken && {
              [allowedUuid]: {
                desc: `${t('Approve')} ${t('Token')}`,
                status: TXN_STATUS.START,
                hash: null,
              },
            }),
            [mintUuid]: {
              desc: t('Send As Gift'),
              status: TXN_STATUS.START,
              hash: null,
            },
          },
        })

        if (!allowedToken) {
          const isSuccess = await writeTxn(key, allowedUuid, contract, 'approve', [tokenAddress, 0])
          if (!isSuccess) {
            setLoading(false)
            return false
          }
        }
        const isSuccess = await writeTxn(key, mintUuid, contract, 'mintUsernameFor', [
          toAddress,
          username,
          tokenAddress,
          DEFAULT_TRAITS,
          DEFAULT_PROOFS,
        ])
        if (!isSuccess) {
          setLoading(false)
          return false
        }
        endTxn({
          key,
          final: 'Send As Gift Successful',
        })
        setLoading(false)
        closeTxnModal()
        return true
      }
    },
    [closeTxnModal, endTxn, startTxn, t, writeTxn],
  )

  return { loading, giftThenaId }
}
