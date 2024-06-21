import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { TXN_STATUS } from '@/constant'
import { sendCall, waitCall, writeCall } from '@/lib/contractActions'
import { errorToast, successToast } from '@/lib/notify'

import {
  closeTransaction,
  completeTransaction,
  openRetryTransactionModal,
  openTransaction,
  updateTransaction,
} from './actions'
import { useChainSettings } from '../settings/hooks'

export const useTxn = () => {
  const { networkId } = useChainSettings()
  const dispatch = useDispatch()

  const startTxn = useCallback(
    params => {
      dispatch(openTransaction(params))
    },
    [dispatch],
  )

  const updateTxn = useCallback(
    params => {
      dispatch(updateTransaction(params))
    },
    [dispatch],
  )

  const endTxn = useCallback(
    params => {
      dispatch(completeTransaction(params))
    },
    [dispatch],
  )

  const closeTxn = useCallback(() => {
    dispatch(closeTransaction())
  }, [dispatch])

  const askUserToRetry = useCallback(
    params =>
      new Promise(resolve => {
        dispatch(openRetryTransactionModal({ params, resolver: resolve }))
      }),
    [dispatch],
  )

  const writeTxn = useCallback(
    async (key, uuid, contract, method, params = [], msgValue = '0') => {
      let hash
      updateTxn({
        key,
        uuid,
        status: TXN_STATUS.WAITING,
      })
      try {
        hash = await writeCall(contract, method, params, msgValue, networkId)
        updateTxn({
          key,
          uuid,
          status: TXN_STATUS.PENDING,
          hash,
        })
        const txnReceipt = await waitCall(hash)
        updateTxn({
          key,
          uuid,
          status: TXN_STATUS.SUCCESS,
          hash,
        })
        successToast('Transaction confirmed', hash, networkId)
        console.log('txnReceipt :>> ', txnReceipt)
        return hash
      } catch (error) {
        console.log(error)
        console.log(error?.shortMessage)
        if (error && error.name === 'TransactionReceiptNotFoundError') {
          // Fix case if RPC error -> still shows tx
          updateTxn({
            key,
            uuid,
            status: TXN_STATUS.SUCCESS,
            hash,
          })
          successToast('Transaction confirmed', hash, networkId)
          return true
        }
        updateTxn({
          key,
          uuid,
          status: TXN_STATUS.FAILED,
          hash,
        })
        errorToast('Error', error.shortMessage)
        const userWantsToRetry = await askUserToRetry({ key, uuid, contract, method, params, msgValue })
        if (userWantsToRetry) {
          console.log('truuuuuuueeeee')
          return writeTxn(key, uuid, contract, method, params, msgValue) // retry
        }
        console.log('tessttttt')
        return false
      }
    },
    [updateTxn, networkId, askUserToRetry],
  )

  const sendTxn = useCallback(
    async (key, uuid, to, data, value = '0') => {
      let hash
      updateTxn({
        key,
        uuid,
        status: TXN_STATUS.WAITING,
      })
      try {
        hash = await sendCall(to, data, value, networkId)
        updateTxn({
          key,
          uuid,
          status: TXN_STATUS.PENDING,
          hash,
        })
        const txnReceipt = await waitCall(hash)
        updateTxn({
          key,
          uuid,
          status: TXN_STATUS.SUCCESS,
          hash,
        })
        successToast('Transaction confirmed', hash, networkId)
        console.log('txnReceipt :>> ', txnReceipt)
        return true
      } catch (error) {
        console.log(error)
        console.log(error?.shortMessage)
        if (error && error.name === 'TransactionReceiptNotFoundError') {
          // Fix case if RPC error -> still shows tx
          updateTxn({
            key,
            uuid,
            status: TXN_STATUS.SUCCESS,
            hash,
          })
          successToast('Transaction confirmed', hash, networkId)
          return true
        }
        updateTxn({
          key,
          uuid,
          status: TXN_STATUS.FAILED,
          hash,
        })
        errorToast('Error', error.shortMessage)
        return false
      }
    },
    [updateTxn, networkId],
  )

  return { startTxn, updateTxn, endTxn, closeTxn, writeTxn, sendTxn }
}
