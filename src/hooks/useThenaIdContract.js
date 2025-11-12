import { gql } from 'graphql-request'
import { concat } from 'lodash'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { ChainId } from 'thena-sdk-core'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256 } from 'viem'

import { TXN_STATUS } from '@/constant'
import { ThenaIdTraitABI } from '@/constant/abi/core/ThenaIdTraitABI'
import useWallet from '@/hooks/useWallet'
import { callMulti, readCall } from '@/lib/contractActions'
import { getERC20Contract, getThenaIDContract } from '@/lib/contracts'
import { v4Client } from '@/lib/graphql'
import { fromWei } from '@/lib/utils'
import { useTxn } from '@/state/transactions/hooks'

const NORMAL_TRAITS = ['ARABIC_NUMERALS', 'CHARACTER_SET', 'EMOJI_CLUB', 'EMOJI_NUMERALS', 'HINDI_NUMERALS', 'NUMERALS']
const NORMAL_TRAIT_ADDRESS = [
  '0x104ea02fe5CCc7545385D56eb98162b84e50987E',
  '0x4032c9817DAD65AbfD695c5962Ae1A5935F986B6',
  '0x60509a0b946BE9509B565ae643EFa8E32C7d3C83',
  '0x281b0a5B444BeaE8124e6dd10690F77D23493F2C',
  '0xCB0aDEB12FECfF1E3583cEf47b7688BbB3b96807',
  '0xA14ADF1fCbCe62C0ccf26157D931b85AA345Fa66',
]

const DEFAULT_TRAITS = ['CHARACTER_SET']
const DEFAULT_PROOFS = [[]]

const USDT_TOKEN_ADDRESS = '0x55d398326f99059fF775485246999027B3197955'

const V4_THENA_ID_AVAILABLES = gql`
  query V4_THENA_ID_AVAILABLES($name: String) {
    thenaIdAvailables(where: { name_eq: $name }) {
      trait
      proof
    }
  }
`

const V4_THENA_ID_COUNT_AVAILABLES = gql`
  query V4_THENA_ID_AVAILABLES {
    thenaIdAvailableTotalCount
  }
`

const V4_AVAILABLE_THENA_ID_BY_OFFSET = gql`
  query ThenaIdByOffset($offset: Int) {
    thenaIdAvailables(offset: $offset, limit: 1) {
      name
    }
  }
`

const getCountThenaIdAvailables = async () => {
  try {
    const { thenaIdAvailableTotalCount } = await v4Client.request(V4_THENA_ID_COUNT_AVAILABLES)
    return thenaIdAvailableTotalCount
  } catch (error) {
    return 0
  }
}

const getThenaIdByOffset = async offset => {
  try {
    const { thenaIdAvailables } = await v4Client.request(V4_AVAILABLE_THENA_ID_BY_OFFSET, { offset })
    return thenaIdAvailables?.[0]?.name ?? null
  } catch (error) {
    return null
  }
}

export const useRandomThenaId = () => {
  const [total, setTotal] = useState()

  const countAvailable = useCallback(async () => {
    const thenaIdAvailableTotalCount = await getCountThenaIdAvailables()
    setTotal(thenaIdAvailableTotalCount)
  }, [])
  const randomThenaId = useCallback(async () => {
    const randomIndex = Math.floor(Math.random() * total)
    return await getThenaIdByOffset(randomIndex)
  }, [total])

  useEffect(() => {
    countAvailable()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { randomThenaId, availableCount: total }
}

const getThenaIdAvailables = async name => {
  try {
    const { thenaIdAvailables } = await v4Client.request(V4_THENA_ID_AVAILABLES, { name })
    return thenaIdAvailables
  } catch (error) {
    return []
  }
}

export const useTraitsAndProofs = () => {
  const getTraitsAndProofsForMerkle = useCallback(async username => {
    try {
      const traits = []
      const proofs = []

      const thenaIdAvailables = await getThenaIdAvailables(username)
      if (thenaIdAvailables.length) {
        thenaIdAvailables.forEach(thenaIdName => {
          traits.push(thenaIdName.trait)
          proofs.push(thenaIdName.proof)
        })
      }

      return {
        traits,
        proofs,
      }
    } catch (error) {
      return {
        traits: [],
        proofs: [],
      }
    }
  }, [])

  const getTraitsAndProofsForNormal = useCallback(async username => {
    try {
      const traits = []
      const proofs = []

      const traitList = await callMulti(
        NORMAL_TRAIT_ADDRESS.map(address => ({
          address,
          abi: ThenaIdTraitABI,
          functionName: 'getTrait',
          args: [username],
          chainId: ChainId.BSC,
        })),
      )

      traitList.forEach((trait, index) => {
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

  const getTraitsAndProofs = useCallback(
    async username => {
      const [getNormal, getMerkle] = await Promise.all([
        getTraitsAndProofsForNormal(username),
        getTraitsAndProofsForMerkle(username),
      ])

      return {
        traits: concat(getNormal.traits, getMerkle.traits),
        proofs: concat(getNormal.proofs, getMerkle.proofs),
      }
    },
    [getTraitsAndProofsForMerkle, getTraitsAndProofsForNormal],
  )
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
          title: 'Mint Thena Id',
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
          title: 'Send As Gift',
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
          title: 'Mint Thena Id',
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
          title: 'Send As Gift',
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

export const useTransferThenaId = () => {
  const [loading, setLoading] = useState(false)
  const t = useTranslations()
  const { startTxn, endTxn, writeTxn, closeTxnModal } = useTxn()
  const { account } = useWallet()

  const onTransfer = useCallback(
    async (toAddress, tokenId) => {
      const thenaIdContract = getThenaIDContract()
      if (account && toAddress && thenaIdContract) {
        const key = uuidv4()
        const transferUuid = uuidv4()

        setLoading(true)
        startTxn({
          key,
          title: 'Transfer THENA ID',
          transactions: {
            [transferUuid]: {
              desc: t('Transfer THENA ID'),
              status: TXN_STATUS.START,
              hash: null,
            },
          },
        })

        const isSuccess = await writeTxn(key, transferUuid, thenaIdContract, 'safeTransferFrom', [
          account.toLowerCase(),
          toAddress.toLowerCase(),
          tokenId,
        ])

        if (!isSuccess) {
          setLoading(false)
          return false
        }
        endTxn({
          key,
          final: 'Transfer THENA ID Successful',
        })
        setLoading(false)
        closeTxnModal()
        return isSuccess
      }
    },
    [account, closeTxnModal, endTxn, startTxn, t, writeTxn],
  )

  return { loading, onTransfer }
}
