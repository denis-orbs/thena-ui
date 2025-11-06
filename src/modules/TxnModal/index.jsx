import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Info } from '@/components/alert'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import Spinner from '@/components/spinner'
import { TextHeading } from '@/components/typography'
import { TXN_STATUS } from '@/constant'
import InfoIcon from '@/icons/InfoIcon'
import { clearRetryParams, closeRetryTransactionModal } from '@/state/transactions/actions'
import { useTxn } from '@/state/transactions/hooks'

import CheckCircleIcon from '~/svgs/checkCircle.svg'

function TxnModal() {
  const { popup, title, transactions, final, retryParams, retryModalIsOpen, retryResolver } = useSelector(
    state => state.transactions,
  )
  const dispatch = useDispatch()
  const { closeTxn } = useTxn()
  const t = useTranslations()

  const handleRetryTxn = useCallback(() => {
    dispatch(closeRetryTransactionModal())
    if (retryParams && retryResolver) {
      retryResolver(true)
    }
    dispatch(clearRetryParams())
  }, [dispatch, retryParams, retryResolver])

  const handleCancelRetry = useCallback(() => {
    dispatch(closeRetryTransactionModal())
    if (retryResolver) {
      retryResolver(false)
    }
    dispatch(clearRetryParams())
  }, [dispatch, retryResolver])

  const txns = useMemo(() => {
    if (!transactions) return []
    return Object.values(transactions)
  }, [transactions])

  const isCloseOnOverlayClick = useMemo(() => Boolean(final), [final])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isCloseOnOverlayClick) {
        closeTxn()
      }
    }, 5000)
    return () => clearTimeout(timeoutId)
  }, [closeTxn, isCloseOnOverlayClick])

  return (
    <Modal
      isOpen={popup}
      closeModal={() => {
        closeTxn()
      }}
      width={480}
      zIndex={70}
      title={title}
      shouldCloseOnOverlayClick={isCloseOnOverlayClick}
    >
      <ModalBody className='pb-0'>
        <div className='flex flex-col gap-5'>
          {txns &&
            txns.map((txn, idx) => (
              <div
                className='flex items-center justify-between border-b border-neutral-700 pb-5 last:border-0 last:p-0'
                key={`txn-${idx}`}
              >
                <TextHeading>{txn.desc}</TextHeading>
                {txn.status === TXN_STATUS.SUCCESS && <CheckCircleIcon className='h-5 w-5' />}
                {txn.status === TXN_STATUS.WAITING && (
                  <CircleImage className='h-5 w-5 rounded-full' src='/images/spin.png' alt='thena spin' />
                )}
                {txn.status === TXN_STATUS.PENDING && <Spinner />}
                {txn.status === TXN_STATUS.FAILED && <InfoIcon className='stroke-error-600 size-5' />}
              </div>
            ))}
        </div>
        {final && (
          <Info>
            <InfoIcon className='stroke-primary-600' />
            <p>{t('All done')}</p>
          </Info>
        )}
      </ModalBody>
      {retryModalIsOpen && (
        <ModalFooter className='mt-4 flex gap-4'>
          <EmphasisButton
            className='w-full'
            onClick={() => {
              handleCancelRetry()
            }}
          >
            {t('Cancel')}
          </EmphasisButton>
          <PrimaryButton className='w-full' onClick={handleRetryTxn}>
            {t('Retry')}
          </PrimaryButton>
        </ModalFooter>
      )}
    </Modal>
  )
}

export default TxnModal
