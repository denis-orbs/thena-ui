import { createClient } from '@chainlink/ccip-js'
import { useCallback, useState } from 'react'
import { parseUnits } from 'viem'
import { usePublicClient, useWalletClient } from 'wagmi'

import { TXN_STATUS } from '@/constant'
import useWallet from '@/hooks/useWallet'
import { waitCall } from '@/lib/contractActions'
import { errorToast, successToast } from '@/lib/notify'
import { useTxn } from '@/state/transactions/hooks'

// Generic CCIP test bridge hook, parameterized for testnets
// Expects config with: sourceRouter, destinationChainSelector, tokenAddress, decimals
export const useCcipTestBridge = config => {
  const [pending, setPending] = useState(false)
  const { account } = useWallet()
  const { startTxn, endTxn, updateTxn, askUserToRetry } = useTxn()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const approveRouter = useCallback(
    async ({ key, uuid, amount, ccipClient }) => {
      let hash
      updateTxn({ key, uuid, status: TXN_STATUS.WAITING })
      try {
        hash = (
          await ccipClient.approveRouter({
            walletClient,
            tokenAddress: config.tokenAddress,
            routerAddress: config.sourceRouter,
            amount,
            waitForReceipt: false,
          })
        )?.txHash

        updateTxn({ key, uuid, status: TXN_STATUS.PENDING, hash })
        const txnReceipt = await waitCall(hash)
        updateTxn({ key, uuid, status: TXN_STATUS.SUCCESS, hash })
        successToast('Approval confirmed')
        return txnReceipt
      } catch (error) {
        updateTxn({ key, uuid, status: TXN_STATUS.FAILED, hash })
        errorToast(error?.shortMessage || error?.message || 'Approval failed')
        const retry = await askUserToRetry({
          key,
          uuid,
          retryFn: () => approveRouter({ key, uuid, amount, ccipClient }),
        })
        return retry || false
      }
    },
    [updateTxn, walletClient, askUserToRetry, config?.tokenAddress, config?.sourceRouter],
  )

  const transferTokens = useCallback(
    async ({ key, uuid, amount, ccipClient, targetAddress }) => {
      let hash
      updateTxn({ key, uuid, status: TXN_STATUS.WAITING })
      try {
        hash = (
          await ccipClient.transferTokens({
            walletClient,
            routerAddress: config.sourceRouter,
            destinationChainSelector: config.destinationChainSelector,
            destinationAddress: targetAddress,
            amount,
            tokenAddress: config.tokenAddress,
          })
        )?.txHash
        updateTxn({ key, uuid, status: TXN_STATUS.SUCCESS, hash })
        successToast('Bridge transaction sent')
        return hash
      } catch (error) {
        updateTxn({ key, uuid, status: TXN_STATUS.FAILED, hash })
        errorToast(error?.shortMessage || error?.message || 'Bridge failed')
        const retry = await askUserToRetry({
          key,
          uuid,
          retryFn: () => transferTokens({ key, uuid, amount, ccipClient, targetAddress }),
        })
        return retry || false
      }
    },
    [
      updateTxn,
      walletClient,
      askUserToRetry,
      config?.sourceRouter,
      config?.destinationChainSelector,
      config?.tokenAddress,
    ],
  )

  const onBridge = useCallback(
    async (targetAddress, amountStr) => {
      if (!targetAddress || !amountStr || !account) return
      const amountWei = parseUnits(String(amountStr), config.decimals || 18)
      setPending(true)

      try {
        const ccipClient = createClient()

        // Validate token support on source router
        const tokenSupported = await ccipClient.isTokenSupported({
          client: publicClient,
          routerAddress: config.sourceRouter,
          tokenAddress: config.tokenAddress,
          destinationChainSelector: config.destinationChainSelector,
        })
        if (!tokenSupported) throw new Error('Token not supported on CCIP for this route')

        // Check allowance
        const allowance = await ccipClient.getAllowance({
          client: publicClient,
          routerAddress: config.sourceRouter,
          tokenAddress: config.tokenAddress,
          account,
        })

        const key = `${Date.now()}`
        const approveId = `${key}-approve`
        const bridgeId = `${key}-bridge`

        const transactions = {}
        if (allowance < amountWei) {
          transactions[approveId] = { desc: 'Approve token', status: TXN_STATUS.START, hash: null }
        }
        transactions[bridgeId] = { desc: 'Bridge tokens (testnet)', status: TXN_STATUS.START, hash: null }

        startTxn({ key, title: 'CCIP Test Bridge', transactions })

        if (allowance < amountWei) {
          const approved = await approveRouter({ key, uuid: approveId, amount: amountWei, ccipClient })
          if (!approved) {
            setPending(false)
            return
          }
        }

        const bridged = await transferTokens({ key, uuid: bridgeId, amount: amountWei, ccipClient, targetAddress })
        if (!bridged) {
          setPending(false)
          return
        }

        endTxn({ key, final: 'Bridge submitted' })
      } catch (err) {
        console.error('[Bridge Error]', err)
        errorToast(err?.shortMessage || err?.message || 'Bridge error')
      } finally {
        setPending(false)
      }
    },
    [account, publicClient, config, startTxn, endTxn, approveRouter, transferTokens],
  )

  return { onBridge, pending }
}

export default useCcipTestBridge
