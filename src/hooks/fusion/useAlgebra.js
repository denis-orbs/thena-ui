import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { JSBI, Percent } from 'thena-sdk-core'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256, parseUnits } from 'viem'

import { TXN_STATUS } from '@/constant'
import Contracts from '@/constant/contracts'
import useWallet from '@/hooks/useWallet'
import { readCall } from '@/lib/contractActions'
import { getERC20Contract } from '@/lib/contracts'
import { NonfungiblePositionManager } from '@/lib/fusion/entities/nonfungiblePositionManager'
import { fromWei } from '@/lib/utils'
import { useSettings } from '@/state/settings/hooks'
import { useTxn } from '@/state/transactions/hooks'

export const useAlgebraAdd = (version = 3) => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, writeTxn, endTxn, sendTxn } = useTxn()
  const t = useTranslations()

  const onAlgebraAdd = useCallback(
    async (amountA, amountB, baseCurrency, quoteCurrency, mintInfo, slippage, deadline) => {
      try {
        const key = uuidv4()
        const approve1uuid = uuidv4()
        const approve2uuid = uuidv4()
        const adduuid = uuidv4()

        const algebraAddress =
          version === 2
            ? Contracts.nonfungiblePositionManagerV2[chainId]
            : Contracts.nonfungiblePositionManagerV3[chainId]

        const allowedSlippage = new Percent(JSBI.BigInt(slippage * 100), JSBI.BigInt(10000))
        const { position, depositADisabled, depositBDisabled, noLiquidity } = mintInfo
        const baseCurrencyAddress = baseCurrency.wrapped?.address.toLowerCase()
        const quoteCurrencyAddress = quoteCurrency.wrapped?.address.toLowerCase()
        let isFirstApproved = true
        let isSecondApproved = true
        const firstContract = !baseCurrency.isNative ? getERC20Contract(baseCurrencyAddress, chainId) : null
        const secondContract = !quoteCurrency.isNative ? getERC20Contract(quoteCurrencyAddress, chainId) : null
        if (!baseCurrency.isNative && !depositADisabled) {
          const allowance = await readCall(firstContract, 'allowance', [account, algebraAddress], chainId)
          isFirstApproved = fromWei(allowance, baseCurrency.decimals).gte(amountA.toExact(), baseCurrency.decimals)
        }
        if (!quoteCurrency.isNative && !depositBDisabled) {
          const allowance = await readCall(secondContract, 'allowance', [account, algebraAddress], chainId)
          isSecondApproved = fromWei(allowance, quoteCurrency.decimals).gte(amountB.toExact(), quoteCurrency.decimals)
        }

        const transactions = {}

        if (!isFirstApproved) {
          transactions[approve1uuid] = {
            desc: `${t('Approve')} ${baseCurrency.symbol}`,
            status: TXN_STATUS.START,
            hash: null,
          }
        }

        if (!isSecondApproved) {
          transactions[approve2uuid] = {
            desc: `${t('Approve')} ${quoteCurrency.symbol}`,
            status: TXN_STATUS.START,
            hash: null,
          }
        }

        transactions[adduuid] = {
          desc: t(mintInfo.noLiquidity ? 'Create pool and add liquidity' : 'Add Liquidity'),
          status: TXN_STATUS.START,
          hash: null,
        }

        startTxn({
          key,
          title: t(mintInfo.noLiquidity ? 'Create pool and add liquidity' : 'Add Liquidity'),
          transactions,
        })

        setPending(true)
        if (!isFirstApproved) {
          if (!(await writeTxn(key, approve1uuid, firstContract, 'approve', [algebraAddress, maxUint256]))) {
            setPending(false)
            return
          }
        }

        if (!isSecondApproved) {
          if (!(await writeTxn(key, approve2uuid, secondContract, 'approve', [algebraAddress, maxUint256]))) {
            setPending(false)
            return
          }
        }

        const timestamp = Math.floor(new Date().getTime() / 1000) + deadline * 60
        const useNative = baseCurrency.isNative ? baseCurrency : quoteCurrency.isNative ? quoteCurrency : undefined
        const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, {
          slippageTolerance: allowedSlippage,
          recipient: account,
          deadline: timestamp.toString(),
          useNative,
          createPool: noLiquidity,
        })
        if (!(await sendTxn(key, adduuid, algebraAddress, calldata, value))) {
          setPending(false)
          return
        }

        endTxn({
          key,
          final: 'Liquidity Add Successful',
        })
        setPending(false)
      } catch (e) {
        setPending(false)
        throw e
      }
    },
    [version, chainId, startTxn, t, account, sendTxn, endTxn, writeTxn],
  )

  return { onAlgebraAdd, pending }
}

export const useAlgebraClaim = (version = 3) => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, sendTxn } = useTxn()
  const t = useTranslations()

  const onAlgebraClaim = useCallback(
    async (tokenId, feeValue0, feeValue1, callback) => {
      const key = uuidv4()
      const claimuuid = uuidv4()
      startTxn({
        key,
        title: t('Claim Fees'),
        transactions: {
          [claimuuid]: {
            desc: t('Claim Fees'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      setPending(true)
      const algebraAddress =
        version === 2
          ? Contracts.nonfungiblePositionManagerV2[chainId]
          : Contracts.nonfungiblePositionManagerV3[chainId]

      const { calldata, value } = NonfungiblePositionManager.collectCallParameters({
        tokenId,
        expectedCurrencyOwed0: feeValue0,
        expectedCurrencyOwed1: feeValue1,
        recipient: account,
      })

      if (!(await sendTxn(key, claimuuid, algebraAddress, calldata, value))) {
        setPending(false)
        return
      }
      endTxn({
        key,
        final: 'Claimed fees',
      })
      setPending(false)
      callback()
    },
    [account, startTxn, endTxn, sendTxn, chainId, t, version],
  )

  return { onAlgebraClaim, pending }
}

export const useAlgebraRemove = (version = 3) => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, sendTxn } = useTxn()
  const t = useTranslations()

  const onAlgebraRemove = useCallback(
    async (tokenId, position, liquidityPercentage, feeValue0, feeValue1, slippage, deadline, callback) => {
      const key = uuidv4()
      const removeuuid = uuidv4()
      startTxn({
        key,
        title: t('Remove Liquidity'),
        transactions: {
          [removeuuid]: {
            desc: t('Remove Liquidity'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      setPending(true)
      const algebraAddress =
        version === 2
          ? Contracts.nonfungiblePositionManagerV2[chainId]
          : Contracts.nonfungiblePositionManagerV3[chainId]

      const timestamp = Math.floor(new Date().getTime() / 1000) + deadline * 60
      const allowedSlippage = new Percent(JSBI.BigInt(slippage * 100), JSBI.BigInt(10000))
      const { calldata, value } = NonfungiblePositionManager.removeCallParameters(position, {
        tokenId,
        liquidityPercentage,
        slippageTolerance: allowedSlippage,
        deadline: timestamp.toString(),
        collectOptions: {
          expectedCurrencyOwed0: feeValue0,
          expectedCurrencyOwed1: feeValue1,
          recipient: account,
        },
      })

      if (!(await sendTxn(key, removeuuid, algebraAddress, calldata, value))) {
        setPending(false)
        return
      }

      endTxn({ key, final: 'Removed position' })
      setPending(false)
      callback()
    },
    [account, startTxn, endTxn, sendTxn, chainId, t, version],
  )

  return { onAlgebraRemove, pending }
}

export const useAlgebraBurn = (version = 3) => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, sendTxn } = useTxn()
  const t = useTranslations()

  const onAlgebraBurn = useCallback(
    async (tokenId, callback) => {
      const key = uuidv4()
      const burnuuid = uuidv4()
      startTxn({
        key,
        title: `${t('Burn')} NFT #${tokenId}`,
        transactions: {
          [burnuuid]: {
            desc: `${t('Burn')} NFT #${tokenId}`,
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      setPending(true)
      const algebraAddress =
        version === 2
          ? Contracts.nonfungiblePositionManagerV2[chainId]
          : Contracts.nonfungiblePositionManagerV3[chainId]

      const { calldata, value } = NonfungiblePositionManager.burnCallParameters(tokenId)

      if (!(await sendTxn(key, burnuuid, algebraAddress, calldata, value))) {
        setPending(false)
        return
      }
      endTxn({
        key,
        final: `NFT #${tokenId} Burnt`,
      })
      setPending(false)
      callback()
    },
    [startTxn, endTxn, sendTxn, chainId, t, version],
  )

  return { onAlgebraBurn, pending }
}

export const useAlgebraIncrease = (version = 3) => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn, sendTxn } = useTxn()
  const t = useTranslations()

  const onAlgebraIncrease = useCallback(
    async (amountA, amountB, position, depositADisabled, depositBDisabled, slippage, deadline, tokenId, callback) => {
      const algebraAddress =
        version === 2
          ? Contracts.nonfungiblePositionManagerV2[chainId]
          : Contracts.nonfungiblePositionManagerV3[chainId]

      const allowedSlippage = new Percent(JSBI.BigInt(slippage * 100), JSBI.BigInt(10000))
      const baseCurrency = amountA.currency
      const quoteCurrency = amountB.currency
      const baseCurrencyAddress = baseCurrency.wrapped?.address.toLowerCase()
      const quoteCurrencyAddress = quoteCurrency.wrapped?.address.toLowerCase()
      let isFirstApproved = true
      let isSecondApproved = true
      const firstContract = !baseCurrency.isNative ? getERC20Contract(baseCurrencyAddress, chainId) : null
      const secondContract = !quoteCurrency.isNative ? getERC20Contract(quoteCurrencyAddress, chainId) : null
      if (!baseCurrency.isNative && !depositADisabled) {
        const allowance = await readCall(firstContract, 'allowance', [account, algebraAddress], chainId)
        isFirstApproved = fromWei(allowance, baseCurrency.decimals).gte(amountA.toExact())
      }
      if (!quoteCurrency.isNative && !depositBDisabled) {
        const allowance = await readCall(secondContract, 'allowance', [account, algebraAddress], chainId)
        isSecondApproved = fromWei(allowance, quoteCurrency.decimals).gte(amountB.toExact())
      }
      const key = uuidv4()
      const approve1uuid = uuidv4()
      const approve2uuid = uuidv4()
      const adduuid = uuidv4()
      startTxn({
        key,
        title: t('Add Liquidity'),
        transactions: {
          ...(!isFirstApproved && {
            [approve1uuid]: {
              desc: `${t('Approve')} ${baseCurrency.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          ...(!isSecondApproved && {
            [approve2uuid]: {
              desc: `${t('Approve')} ${quoteCurrency.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [adduuid]: {
            desc: t('Add Liquidity'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      setPending(true)
      if (!isFirstApproved) {
        if (!(await writeTxn(key, approve1uuid, firstContract, 'approve', [algebraAddress, maxUint256]))) {
          setPending(false)
          return
        }
      }

      if (!isSecondApproved) {
        if (!(await writeTxn(key, approve2uuid, secondContract, 'approve', [algebraAddress, maxUint256]))) {
          setPending(false)
          return
        }
      }

      const timestamp = Math.floor(new Date().getTime() / 1000) + deadline * 60
      const useNative = baseCurrency.isNative ? baseCurrency : quoteCurrency.isNative ? quoteCurrency : undefined
      const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, {
        tokenId,
        slippageTolerance: allowedSlippage,
        deadline: timestamp.toString(),
        useNative,
      })

      if (!(await sendTxn(key, adduuid, algebraAddress, calldata, value))) {
        setPending(false)
        return
      }
      endTxn({
        key,
        final: 'Added Liquidity',
      })
      setPending(false)
      callback()
    },
    [version, chainId, startTxn, t, sendTxn, endTxn, account, writeTxn],
  )

  return { onAlgebraIncrease, pending }
}

export const useAlgebraMigration = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, writeTxn, endTxn, sendTxn } = useTxn()
  const { slippage, deadline } = useSettings()

  const t = useTranslations()

  const onAlgebraMigrate = useCallback(
    async ({
      currencyA,
      amountA,
      currencyB,
      amountB,
      mintInfo,
      feeValue0,
      feeValue1,
      tokenId,
      isClaimable,
      callback,
    }) => {
      const key = uuidv4()

      const claimId = uuidv4()
      const removeId = uuidv4()
      const burnId = uuidv4()
      const approveId1 = uuidv4()
      const approveId2 = uuidv4()
      const addId = uuidv4()

      const nftPositionV3 = Contracts.nonfungiblePositionManagerV3[chainId]
      const nftPositionV2 = Contracts.nonfungiblePositionManagerV2[chainId]

      const allowedSlippage = new Percent(JSBI.BigInt(slippage * 100), JSBI.BigInt(10000))

      const { position, idPoolExist } = mintInfo

      const baseCurrencyAddress = currencyA.wrapped?.address.toLowerCase()
      const quoteCurrencyAddress = currencyB.wrapped?.address.toLowerCase()
      let isFirstApproved = true
      let isSecondApproved = true
      const firstContract = !currencyA.isNative ? getERC20Contract(baseCurrencyAddress, chainId) : null
      const secondContract = !currencyB.isNative ? getERC20Contract(quoteCurrencyAddress, chainId) : null

      if (!currencyA.isNative) {
        const allowance = await readCall(firstContract, 'allowance', [account, nftPositionV3], chainId)
        isFirstApproved = allowance >= parseUnits(amountA, currencyA.decimals)
      }

      if (!currencyB.isNative) {
        const allowance = await readCall(secondContract, 'allowance', [account, nftPositionV3], chainId)
        isSecondApproved = allowance >= parseUnits(amountB, currencyB.decimals)
      }

      startTxn({
        key,
        title: `${t('Migrate')}`,
        transactions: {
          ...(isClaimable && {
            [claimId]: {
              desc: t('Claim Rewards'),
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [removeId]: {
            desc: t('Remove Liquidity'),
            status: TXN_STATUS.START,
            hash: null,
          },
          [burnId]: {
            desc: `${t('Burn')} NFT #${tokenId}`,
            status: TXN_STATUS.START,
            hash: null,
          },
          ...(!isFirstApproved && {
            [approveId1]: {
              desc: `${t('Approve')} ${currencyA.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          ...(!isSecondApproved && {
            [approveId2]: {
              desc: `${t('Approve')} ${currencyB.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [addId]: {
            desc: t('Add Liquidity'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      setPending(true)

      // CLAIM ON V2
      if (isClaimable) {
        const { calldata, value } = NonfungiblePositionManager.collectCallParameters({
          tokenId,
          expectedCurrencyOwed0: feeValue0,
          expectedCurrencyOwed1: feeValue1,
          recipient: account,
        })

        if (!(await sendTxn(key, claimId, nftPositionV2, calldata, value))) {
          setPending(false)
          return
        }
      }

      // REMOVE FROM V2
      const timestamp = Math.floor(new Date().getTime() / 1000) + deadline * 60
      const { calldata: removeCallData, value: removeValue } = NonfungiblePositionManager.removeCallParameters(
        position,
        {
          tokenId,
          liquidityPercentage: new Percent(100, 100),
          slippageTolerance: allowedSlippage,
          deadline: timestamp.toString(),
          collectOptions: {
            expectedCurrencyOwed0: feeValue0,
            expectedCurrencyOwed1: feeValue1,
            recipient: account,
          },
        },
      )

      if (!(await sendTxn(key, removeId, nftPositionV2, removeCallData, removeValue))) {
        setPending(false)
        return
      }

      // burn
      const { calldata: burnCalldata, value: burnValue } = NonfungiblePositionManager.burnCallParameters(tokenId)
      if (!(await sendTxn(key, burnId, nftPositionV2, burnCalldata, burnValue))) {
        setPending(false)
        return
      }

      // APPROVE TOKEN TO V3
      if (!isFirstApproved) {
        if (!(await writeTxn(key, approveId1, firstContract, 'approve', [nftPositionV3, maxUint256]))) {
          setPending(false)
          return
        }
      }

      if (!isSecondApproved) {
        if (!(await writeTxn(key, approveId2, secondContract, 'approve', [nftPositionV3, maxUint256]))) {
          setPending(false)
          return
        }
      }

      // ADD liquidity to v3
      const useNative = currencyA.isNative ? currencyA : currencyB.isNative ? currencyB : undefined
      const { calldata: addCallData, value: addValue } = NonfungiblePositionManager.addCallParameters(position, {
        slippageTolerance: allowedSlippage,
        recipient: account,
        deadline: timestamp.toString(),
        useNative,
        createPool: !idPoolExist,
        version: 3,
      })

      if (!(await sendTxn(key, addId, nftPositionV3, addCallData, addValue))) {
        setPending(false)
        return
      }

      endTxn({ key, final: 'Migrate Successful' })
      setPending(false)
      callback()
    },
    [chainId, slippage, startTxn, t, deadline, account, sendTxn, endTxn, writeTxn],
  )

  return { onAlgebraMigrate, pending }
}
