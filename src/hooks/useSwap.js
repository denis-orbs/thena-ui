import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import useSWR from 'swr'
import { ChainId } from 'thena-sdk-core'
import { v4 as uuidv4 } from 'uuid'
import { getAddress, maxUint256, zeroAddress } from 'viem'

import { TXN_STATUS } from '@/constant'
import Contracts from '@/constant/contracts'
import { readCall } from '@/lib/contractActions'
import { getERC20Contract, getWBNBContract } from '@/lib/contracts'
import { fromWei, isInvalidAmount, toWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { useTxn } from '@/state/transactions/hooks'

const EnabledDexIds = '43,47'
const Connectors =
  '0xf4c8e32eadec4bfe97e0f595add0f4450a863a11,0x52f24a5e03aee338da5fd9df68d2b6fae1178827,0x90c97f71e18723b0cf0dfa30ee176ab653e89f40,0x1bdd3cf7f79cfb8edbb955f20ad99211551ba275'
const quoteUrl = 'https://api.odos.xyz/sor/quote/v2'

export const useOdosQuoteSwap = (account, fromAsset, toAsset, fromAmount, slippage, networkId) => {
  const res = useSWR(
    fromAsset &&
      toAsset &&
      networkId === ChainId.BSC &&
      !isInvalidAmount(fromAmount) && [
        'useBestQuoteSwap',
        account,
        fromAsset?.address,
        toAsset?.address,
        fromAmount,
        slippage,
      ],
    async () => {
      const inputAmount = toWei(fromAmount, fromAsset.decimals).dp(0).toString(10)

      const quoteRequestBody = {
        chainId: networkId, // Replace with desired chainId
        inputTokens: [
          {
            tokenAddress: getAddress(fromAsset.address === 'BNB' ? zeroAddress : fromAsset.address), // checksummed input token address
            amount: inputAmount, // input amount as a string in fixed integer precision
          },
        ],
        outputTokens: [
          {
            tokenAddress: getAddress(toAsset.address === 'BNB' ? zeroAddress : toAsset.address), // checksummed output token address
            proportion: 1,
          },
        ],
        userAddr: getAddress(account || zeroAddress), // checksummed user address
        slippageLimitPercent: slippage, // set your slippage limit percentage (1 = 1%),
        referralCode: 121015208, // referral code (recommended)
        sourceWhitelist: ['Wrapped BNB', 'Thena Stable', 'Thena Volatile', 'Thena Fusion'],
        pathVizImage: true,
        disableRFQs: true,
        compact: true,
        pathVizImageConfig: {
          linkColors: ['#B386FF', '#FBA499', '#F9EC66', '#F199EE'],
          nodeColor: '#422D4C',
          nodeTextColor: '#D9D5DB',
          legendTextColor: '#FCE6FB',
          height: 300,
        },
      }

      const response = await fetch(quoteUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteRequestBody),
      })
      let quote
      if (response.status === 200) {
        quote = await response.json()
        // handle quote response data
      }

      return quote
    },
    {
      refreshInterval: 30000,
    },
  )
  return res
}

export const useOdosSwap = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn, sendTxn } = useTxn()
  const t = useTranslations()

  const onOdosSwap = useCallback(
    async (fromAsset, toAsset, fromAmount, toAmount, quote, callback) => {
      const key = uuidv4()
      const approveuuid = uuidv4()
      const swapuuid = uuidv4()
      const routerAddress = Contracts.odos[chainId]
      let isApproved = true
      let tokenContract
      if (fromAsset.address !== 'BNB') {
        tokenContract = getERC20Contract(fromAsset.address, chainId)
        const allowance = await readCall(tokenContract, 'allowance', [account, routerAddress])
        isApproved = fromWei(allowance, fromAsset.decimals).gte(fromAmount)
      }
      startTxn({
        key,
        title: t('Swap [symbolA] for [symbolB]', { symbolA: fromAsset.symbol, symbolB: toAsset.symbol }),
        transactions: {
          ...(!isApproved && {
            [approveuuid]: {
              desc: `${t('Approve')} ${fromAsset.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [swapuuid]: {
            desc: t('Swap [symbolA] for [symbolB]', { symbolA: fromAsset.symbol, symbolB: toAsset.symbol }),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      setPending(true)
      if (!isApproved) {
        if (!(await writeTxn(key, approveuuid, tokenContract, 'approve', [routerAddress, maxUint256]))) {
          setPending(false)
          return
        }
      }

      const assembleRequestBody = {
        userAddr: getAddress(account), // the checksummed address used to generate the quote
        pathId: quote.pathId, // Replace with the pathId from quote response in step 1
        simulate: true, // this can be set to true if the user isn't doing their own estimate gas call for the transaction
      }
      const assembleUrl = 'https://api.odos.xyz/sor/assemble'
      const response = await fetch(assembleUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assembleRequestBody),
      })
      if (response.status !== 200) {
        console.error('Error in Transaction Assembly:', response)
        setPending(false)
        return
      }
      const assembledTransaction = await response.json()
      const { to, data, value } = assembledTransaction.transaction
      if (!(await sendTxn(key, swapuuid, to, data, value))) {
        setPending(false)
        return
      }

      endTxn({
        key,
        final: 'Swap Successful',
      })
      setPending(false)
      callback()
    },
    [account, chainId, startTxn, writeTxn, endTxn, sendTxn, t],
  )

  return { onOdosSwap, pending }
}

export const useBestQuoteSwap = (fromAddress, toAddress, fromAmount, slippage, networkId) =>
  useSWR(
    Boolean(
      fromAddress &&
        toAddress &&
        !isInvalidAmount(fromAmount) &&
        fromAddress.toLowerCase() !== toAddress.toLowerCase() &&
        networkId === ChainId.BSC,
    ) && ['useBestQuoteSwap', fromAddress, toAddress, fromAmount, slippage],
    async () => {
      const inTokenAddress = fromAddress === 'BNB' ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' : fromAddress
      const outTokenAddress = toAddress === 'BNB' ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' : toAddress
      const response = await fetch(
        // eslint-disable-next-line max-len
        `https://open-api.openocean.finance/v3/bsc/quote?chain=bsc&inTokenAddress=${inTokenAddress}&outTokenAddress=${outTokenAddress}&amount=${Number(
          fromAmount,
          // eslint-disable-next-line max-len
        )}&gasPrice=5&slippage=${slippage}&enabledDexIds=${EnabledDexIds}&referrer=0x7aefe9316fe9eff671da6edf4eeafaa93380f197&connectors=${Connectors}`,
        {
          method: 'GET',
        },
      )
      const res = await response.json()

      return res.data
    },
    {
      refreshInterval: 30000,
    },
  )

export const useBestSwap = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn, sendTxn } = useTxn()
  const t = useTranslations()

  const onBestSwap = useCallback(
    async (fromAsset, toAsset, fromAmount, toAmount, slippage, callback) => {
      const key = uuidv4()
      const approveuuid = uuidv4()
      const swapuuid = uuidv4()
      const routerAddress = Contracts.openOcean[chainId]
      let isApproved = true
      let tokenContract
      if (fromAsset.address !== 'BNB') {
        tokenContract = getERC20Contract(fromAsset.address, chainId)
        const allowance = await readCall(tokenContract, 'allowance', [account, routerAddress])
        isApproved = fromWei(allowance, fromAsset.decimals).gte(fromAmount)
      }
      startTxn({
        key,
        title: t('Swap [symbolA] for [symbolB]', { symbolA: fromAsset.symbol, symbolB: toAsset.symbol }),
        transactions: {
          ...(!isApproved && {
            [approveuuid]: {
              desc: `${t('Approve')} ${fromAsset.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [swapuuid]: {
            desc: t('Swap [symbolA] for [symbolB]', { symbolA: fromAsset.symbol, symbolB: toAsset.symbol }),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      setPending(true)
      if (!isApproved) {
        if (!(await writeTxn(key, approveuuid, tokenContract, 'approve', [routerAddress, maxUint256]))) {
          setPending(false)
          return
        }
      }
      const inTokenAddress =
        fromAsset.address === 'BNB' ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' : fromAsset.address
      const outTokenAddress = toAsset.address === 'BNB' ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' : toAsset.address
      const response = await fetch(
        // eslint-disable-next-line max-len
        `https://open-api.openocean.finance/v3/bsc/swap_quote?inTokenAddress=${inTokenAddress}&outTokenAddress=${outTokenAddress}&amount=${new BigNumber(
          fromAmount,
        )
          .dp(fromAsset.decimals)
          .toString(10)}&gasPrice=5&slippage=${slippage}&account=${account}&enabledDexIds=${EnabledDexIds}
            &referrer=0x7aefe9316fe9eff671da6edf4eeafaa93380f197&connectors=${Connectors}`,
        {
          method: 'GET',
        },
      )
      const res = await response.json()
      if (!res.data) {
        setPending(false)
        return
      }
      const { data, value } = res.data
      if (!(await sendTxn(key, swapuuid, routerAddress, data, value))) {
        setPending(false)
        return
      }

      endTxn({
        key,
        final: 'Swap Successful',
      })
      setPending(false)
      callback()
    },
    [account, chainId, startTxn, writeTxn, sendTxn, endTxn, t],
  )

  return { onBestSwap, pending }
}

export const useWrap = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const onWrap = useCallback(
    async amount => {
      const key = uuidv4()
      const wrapuuid = uuidv4()

      setPending(true)

      startTxn({
        key,
        title: t('Wrap'),
        transactions: {
          [wrapuuid]: {
            desc: t('Wrap'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      const wbnbContract = getWBNBContract(chainId)
      if (!(await writeTxn(key, wrapuuid, wbnbContract, 'deposit', [], toWei(amount).toFixed(0)))) {
        setPending(false)
        return
      }

      endTxn({
        key,
        final: 'Wrap Successful',
      })
      setPending(false)
    },
    [chainId, startTxn, writeTxn, endTxn, t],
  )

  const onUnwrap = useCallback(
    async amount => {
      const key = uuidv4()
      const unwrapuuid = uuidv4()

      setPending(true)

      startTxn({
        key,
        title: t('Unwrap'),
        transactions: {
          [unwrapuuid]: {
            desc: t('Unwrap'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      const wbnbContract = getWBNBContract(chainId)
      if (!(await writeTxn(key, unwrapuuid, wbnbContract, 'withdraw', [toWei(amount).toFixed(0)]))) {
        setPending(false)
        return
      }

      endTxn({
        key,
        final: 'Unwrap Successful',
      })
      setPending(false)
    },
    [chainId, startTxn, writeTxn, endTxn, t],
  )

  return { onWrap, onUnwrap, pending }
}
