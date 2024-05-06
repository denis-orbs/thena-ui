import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { TXN_STATUS } from '@/constant'
import { readCall } from '@/lib/contractActions'
import { getERC20Contract, getThenaIDContract } from '@/lib/contracts'
import { fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { useTxn } from '@/state/transactions/hooks'

const DEFAULT_TRAITS = ['CHARACTER_SET']
const DEFAULT_PROOFS = [[]]
const USDT_TOKEN_ADDRESS = '0x55d398326f99059fF775485246999027B3197955'

export const useValidateUserName = () => {
  const [loading, setLoading] = useState(false)
  const validate = useCallback(async username => {
    const contract = getThenaIDContract()
    if (username && contract) {
      try {
        setLoading(true)
        const [available, valid, length] = await Promise.all([
          readCall(contract, 'isUsernameAvailable', [username]),
          readCall(contract, 'validateUsername', [username]),
          readCall(contract, 'getLength', [username]),
        ])

        console.log({
          available,
          valid,
          length,
        })
        return {
          available,
          valid,
          length,
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

export const useUSDTCostPerToken = () => {
  const [loading, setLoading] = useState(false)
  const [costPerToken, setCostPerToken] = useState()
  const getCost = useCallback(async () => {
    const contract = getThenaIDContract()
    if (contract) {
      try {
        setLoading(true)
        const cost = await readCall(contract, 'costPerToken', [USDT_TOKEN_ADDRESS])
        setCostPerToken(cost)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    getCost()
  }, [getCost])

  return { loading, costPerToken }
}

export const useMintThenaId = () => {
  const [loading, setLoading] = useState(false)
  const t = useTranslations()
  const { startTxn, endTxn, writeTxn, closeTxnModal } = useTxn()
  const { account, chainId } = useWallet()

  const buyThenaId = useCallback(
    async (username, estimateCost) => {
      const thenaIdContract = getThenaIDContract()
      if (username && thenaIdContract) {
        const key = uuidv4()
        const mintUuid = uuidv4()
        const approveTokenUuid = uuidv4()
        const tokenContract = getERC20Contract(USDT_TOKEN_ADDRESS, chainId)
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
          USDT_TOKEN_ADDRESS,
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
    async (username, toAddress) => {
      const contract = getThenaIDContract()
      if (username && contract && USDT_TOKEN_ADDRESS) {
        const key = uuidv4()
        const mintUuid = uuidv4()
        const allowedUuid = uuidv4()
        const allowedToken = await readCall(contract, 'allowedTokens', [USDT_TOKEN_ADDRESS])

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
          const isSuccess = await writeTxn(key, allowedUuid, contract, 'approve', [USDT_TOKEN_ADDRESS, 0])
          if (!isSuccess) {
            setLoading(false)
            return false
          }
        }
        const isSuccess = await writeTxn(key, mintUuid, contract, 'mintUsernameFor', [
          toAddress,
          username,
          USDT_TOKEN_ADDRESS,
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

export const useBatchMintThenaId = () => {
  const [loading, setLoading] = useState(false)
  const t = useTranslations()
  const { startTxn, endTxn, writeTxn, closeTxnModal } = useTxn()
  const { account, chainId } = useWallet()

  const batchMintThenaId = useCallback(
    async (usernames, estimateCost) => {
      const thenaIdContract = getThenaIDContract()
      if (usernames.length && thenaIdContract) {
        const key = uuidv4()
        const mintUuid = uuidv4()
        const approveTokenUuid = uuidv4()
        const tokenContract = getERC20Contract(USDT_TOKEN_ADDRESS, chainId)
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

        const isSuccess = await writeTxn(key, mintUuid, thenaIdContract, 'batchMintUsername', [
          usernames,
          USDT_TOKEN_ADDRESS,
          usernames.map(() => DEFAULT_TRAITS),
          usernames.map(() => DEFAULT_PROOFS),
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

  return { loading, batchMintThenaId }
}

export const useBatchGiftThenaId = () => {
  const [loading, setLoading] = useState(false)
  const t = useTranslations()
  const { startTxn, endTxn, writeTxn, closeTxnModal } = useTxn()
  const batchGiftThenaId = useCallback(
    async (usernames, toAddress) => {
      const contract = getThenaIDContract()
      if (usernames.length && contract && USDT_TOKEN_ADDRESS) {
        const key = uuidv4()
        const mintUuid = uuidv4()
        const allowedUuid = uuidv4()
        const allowedToken = await readCall(contract, 'allowedTokens', [USDT_TOKEN_ADDRESS])

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
          const isSuccess = await writeTxn(key, allowedUuid, contract, 'approve', [USDT_TOKEN_ADDRESS, 0])
          if (!isSuccess) {
            setLoading(false)
            return false
          }
        }
        const isSuccess = await writeTxn(key, mintUuid, contract, 'batchMintUsernameFor', [
          toAddress,
          usernames,
          USDT_TOKEN_ADDRESS,
          usernames.map(() => DEFAULT_TRAITS),
          usernames.map(() => DEFAULT_PROOFS),
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

  return { loading, batchGiftThenaId }
}
