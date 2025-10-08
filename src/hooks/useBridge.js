import { createClient } from '@chainlink/ccip-js'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { parseUnits } from 'viem'
import { usePublicClient, useWalletClient } from 'wagmi'

import { TXN_STATUS } from '@/constant'
import { CCIP_SUPPORTS } from '@/constant/bridge/ccip'
import Contracts, { CHAIN_ID } from '@/constant/contracts'
import useWallet from '@/hooks/useWallet'
import { waitCall } from '@/lib/contractActions'
import { errorToast, successToast } from '@/lib/notify'
import { useTxn } from '@/state/transactions/hooks'

export const useBridge = () => {
  const [pending, setPending] = useState(false)
  const { account } = useWallet()
  const { startTxn, endTxn, updateTxn } = useTxn()
  const t = useTranslations()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { routerAddress } = CCIP_SUPPORTS.OPBNB
  const tokenAddress = Contracts.THE[CHAIN_ID.OPBNB]
  const destinationChainSelector = CCIP_SUPPORTS.BNB.chainSelector
  const ccipClient = createClient()

  const networkId = CHAIN_ID.OPBNB

  const getFee = useCallback(
    async ({ amount, targetAddress }) => {
      try {
        return await ccipClient.getFee({
          client: publicClient,
          routerAddress,
          destinationChainSelector,
          destinationAccount: targetAddress,
          amount,
          tokenAddress,
        })
      } catch (error) {
        console.error('[CCIP Tx Error]', error)

        return null
      }
    },
    [ccipClient, publicClient, routerAddress, destinationChainSelector, tokenAddress],
  )

  const approveRouter = useCallback(
    async ({ key, uuid, amount }) => {
      let hash

      updateTxn({ key, uuid, status: TXN_STATUS.WAITING })

      try {
        hash = (
          await ccipClient.approveRouter({
            client: walletClient,
            tokenAddress,
            routerAddress,
            amount,
          })
        )?.txHash

        updateTxn({ key, uuid, status: TXN_STATUS.PENDING, hash, networkId })
        const txnReceipt = await waitCall(hash)

        updateTxn({ key, uuid, status: TXN_STATUS.SUCCESS, hash })
        successToast('Transaction confirmed')
        return txnReceipt
      } catch (error) {
        console.error('[CCIP Tx Error]', error)
        updateTxn({ key, uuid, status: TXN_STATUS.FAILED, hash })
        errorToast(error?.shortMessage || error?.message || 'Transaction failed')
        return false
      }
    },
    [updateTxn, walletClient, tokenAddress, routerAddress, networkId, ccipClient],
  )

  const transferTokens = useCallback(
    async ({ key, uuid, amount, targetAddress }) => {
      let hash

      updateTxn({ key, uuid, status: TXN_STATUS.WAITING })

      try {
        updateTxn({ key, uuid, status: TXN_STATUS.PENDING })
        hash = (
          await ccipClient.transferTokens({
            client: walletClient,
            routerAddress,
            destinationChainSelector,
            destinationAccount: targetAddress,
            amount,
            tokenAddress,
          })
        )?.txHash

        updateTxn({ key, uuid, status: TXN_STATUS.SUCCESS, hash })
        successToast('Transaction confirmed')
        return hash
      } catch (error) {
        console.error('[CCIP Tx Error]', error)
        updateTxn({ key, uuid, status: TXN_STATUS.FAILED, hash })
        errorToast(error?.shortMessage || error?.message || 'Transaction failed')
        return false
      }
    },
    [updateTxn, ccipClient, walletClient, routerAddress, destinationChainSelector, tokenAddress],
  )

  const onBridge = useCallback(
    async (targetAddress, amount) => {
      if (!amount || !targetAddress || !account) return
      const amountInWei = parseUnits(amount, 18)

      const key = uuidv4()
      const approveId = uuidv4()
      const bridgeId = uuidv4()

      setPending(true)

      try {
        const tokenSupported = await ccipClient.isTokenSupported({
          client: publicClient,
          routerAddress,
          tokenAddress,
          destinationChainSelector,
        })

        if (!tokenSupported) {
          throw new Error('Token not supported for bridging')
        }

        const allowance = await ccipClient.getAllowance({
          client: publicClient,
          routerAddress,
          tokenAddress,
          account,
        })

        const isApproved = allowance >= amountInWei

        startTxn({
          key,
          title: t('Bridge THE'),
          transactions: {
            ...(!isApproved && {
              [approveId]: {
                desc: t('Approve THE'),
                status: TXN_STATUS.START,
                hash: null,
              },
            }),
            [bridgeId]: {
              desc: t('Bridge [amount] THE to BNB', { amount }),
              status: TXN_STATUS.START,
              hash: null,
            },
          },
        })

        if (!isApproved) {
          const approved = await approveRouter({
            key,
            uuid: approveId,
            amount: amountInWei,
          })
          if (!approved) {
            setPending(false)
            return
          }
        }

        const bridged = await transferTokens({
          key,
          uuid: bridgeId,
          amount: amountInWei,
          targetAddress,
        })

        if (!bridged) {
          setPending(false)
          return
        }

        endTxn({
          key,
          final: t('Bridge successful'),
        })
      } catch (err) {
        console.error('[Bridge Error]', err)
      } finally {
        setPending(false)
      }
    },
    [
      account,
      ccipClient,
      publicClient,
      routerAddress,
      tokenAddress,
      destinationChainSelector,
      startTxn,
      t,
      transferTokens,
      endTxn,
      approveRouter,
    ],
  )

  return { onBridge, pending, getFee }
}
