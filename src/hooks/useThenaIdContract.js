import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { ChainId } from 'thena-sdk-core'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256 } from 'viem'

import { TXN_STATUS } from '@/constant'
import { arabicAbi, characterSetAbi, emojiClubAbi, emojiNumeralAbi, hindiNumeralAbi, numeralAbi } from '@/constant/abi'
import { readCall } from '@/lib/contractActions'
import { getContract, getERC20Contract, getThenaIDContract } from '@/lib/contracts'
import { fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { useTxn } from '@/state/transactions/hooks'

const NORMAL_TRAITS = ['ARABIC_NUMERALS', 'CHARACTER_SET', 'EMOJI_CLUB', 'EMOJI_NUMERALS', 'HINDI_NUMERALS', 'NUMERALS']
const NORMAL_TRAIT_ABIS = [arabicAbi, characterSetAbi, emojiClubAbi, emojiNumeralAbi, hindiNumeralAbi, numeralAbi]

const DEFAULT_TRAITS = ['CHARACTER_SET']
const DEFAULT_PROOFS = [[]]

const USDT_TOKEN_ADDRESS = '0x55d398326f99059fF775485246999027B3197955'

export const useTraitsAndProofs = () => {
  const getTraitsAndProofs = useCallback(async username => {
    try {
      const contract = getThenaIDContract()
      const traits = []
      const proofs = []
      const addresses = await Promise.all(
        NORMAL_TRAITS.map(trait => readCall(contract, 'traitToTraitChecker', [trait])),
      )

      const getTraits = await Promise.all(
        NORMAL_TRAIT_ABIS.map((abi, index) => {
          const traitContract = getContract(abi, addresses[index], ChainId.BSC)

          return readCall(traitContract, 'getTrait', [username])
        }),
      )

      getTraits.forEach((trait, index) => {
        if (trait.length > 0 && trait[0] && trait[1]) {
          traits.push(NORMAL_TRAITS[index])
          proofs.push([])
        }
      })

      return {
        traits,
        proofs,
      }
    } catch (error) {
      return {
        traits: DEFAULT_TRAITS,
        proofs: DEFAULT_PROOFS,
      }
    }
  }, [])

  return { getTraitsAndProofs }
}

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

  const { getTraitsAndProofs } = useTraitsAndProofs()
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
            maxUint256,
          ])
          if (!isSuccess) {
            setLoading(false)
            return false
          }
        }

        const { traits, proofs } = await getTraitsAndProofs(username)

        const isSuccess = await writeTxn(key, mintUuid, thenaIdContract, 'mintUsername', [
          username,
          USDT_TOKEN_ADDRESS,
          traits,
          proofs,
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
    [account, chainId, closeTxnModal, endTxn, getTraitsAndProofs, startTxn, t, writeTxn],
  )

  return { loading, buyThenaId }
}

export const useGiftThenaId = () => {
  const [loading, setLoading] = useState(false)
  const t = useTranslations()
  const { startTxn, endTxn, writeTxn, closeTxnModal } = useTxn()
  const { account, chainId } = useWallet()

  const { getTraitsAndProofs } = useTraitsAndProofs()

  const giftThenaId = useCallback(
    async (username, toAddress, estimateCost) => {
      const contract = getThenaIDContract()

      if (username && contract) {
        const key = uuidv4()
        const mintUuid = uuidv4()
        const approveTokenUuid = uuidv4()
        const tokenContract = getERC20Contract(USDT_TOKEN_ADDRESS, chainId)
        const allowance = await readCall(tokenContract, 'allowance', [account, contract.address])
        const isApprovedToken = fromWei(allowance).gte(fromWei(estimateCost))

        setLoading(true)
        startTxn({
          key,
          title: t('Send As Gift'),
          transactions: {
            ...(!isApprovedToken && {
              [approveTokenUuid]: {
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

        if (!isApprovedToken) {
          const isSuccess = await writeTxn(key, approveTokenUuid, tokenContract, 'approve', [
            contract.address,
            maxUint256,
          ])
          if (!isSuccess) {
            setLoading(false)
            return false
          }
        }

        const { traits, proofs } = await getTraitsAndProofs(username)

        const isSuccess = await writeTxn(key, mintUuid, contract, 'mintUsernameFor', [
          toAddress,
          username,
          USDT_TOKEN_ADDRESS,
          traits,
          proofs,
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
    [account, chainId, closeTxnModal, endTxn, getTraitsAndProofs, startTxn, t, writeTxn],
  )

  return { loading, giftThenaId }
}

export const useBatchMintThenaId = () => {
  const [loading, setLoading] = useState(false)
  const t = useTranslations()
  const { startTxn, endTxn, writeTxn, closeTxnModal } = useTxn()
  const { account, chainId } = useWallet()

  const { getTraitsAndProofs } = useTraitsAndProofs()

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
            maxUint256,
          ])
          if (!isSuccess) {
            setLoading(false)
            return false
          }
        }

        const usernamesTraitsAndProofs = await Promise.all(usernames.map(username => getTraitsAndProofs(username)))

        const isSuccess = await writeTxn(key, mintUuid, thenaIdContract, 'batchMintUsername', [
          usernames,
          USDT_TOKEN_ADDRESS,
          usernamesTraitsAndProofs.map(data => data.traits),
          usernamesTraitsAndProofs.map(data => data.proofs),
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
    [account, chainId, closeTxnModal, endTxn, getTraitsAndProofs, startTxn, t, writeTxn],
  )

  return { loading, batchMintThenaId }
}

export const useBatchGiftThenaId = () => {
  const [loading, setLoading] = useState(false)
  const t = useTranslations()
  const { startTxn, endTxn, writeTxn, closeTxnModal } = useTxn()
  const { account, chainId } = useWallet()

  const { getTraitsAndProofs } = useTraitsAndProofs()

  const batchGiftThenaId = useCallback(
    async (usernames, toAddress, estimateCost) => {
      const contract = getThenaIDContract()
      if (usernames.length && contract) {
        const key = uuidv4()
        const mintUuid = uuidv4()
        const approveTokenUuid = uuidv4()
        const tokenContract = getERC20Contract(USDT_TOKEN_ADDRESS, chainId)
        const allowance = await readCall(tokenContract, 'allowance', [account, contract.address])
        const isApprovedToken = fromWei(allowance).gte(fromWei(estimateCost))
        setLoading(true)
        startTxn({
          key,
          title: t('Send As Gift'),
          transactions: {
            ...(!isApprovedToken && {
              [approveTokenUuid]: {
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

        if (!isApprovedToken) {
          const isSuccess = await writeTxn(key, approveTokenUuid, tokenContract, 'approve', [
            contract.address,
            maxUint256,
          ])
          if (!isSuccess) {
            setLoading(false)
            return false
          }
        }

        const usernamesTraitsAndProofs = await Promise.all(usernames.map(username => getTraitsAndProofs(username)))

        const isSuccess = await writeTxn(key, mintUuid, contract, 'batchMintUsernameFor', [
          toAddress,
          usernames,
          USDT_TOKEN_ADDRESS,
          usernamesTraitsAndProofs.map(data => data.traits),
          usernamesTraitsAndProofs.map(data => data.proofs),
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
    [account, chainId, closeTxnModal, endTxn, getTraitsAndProofs, startTxn, t, writeTxn],
  )

  return { loading, batchGiftThenaId }
}
