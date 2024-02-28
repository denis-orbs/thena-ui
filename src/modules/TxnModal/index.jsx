import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { Info } from '@/components/alert'
import CircleImage from '@/components/image/CircleImage'
import Modal, { ModalBody } from '@/components/modal'
import Spinner from '@/components/spinner'
import { TextHeading } from '@/components/typography'
import { TXN_STATUS } from '@/constant'
import { useTxn } from '@/state/transactions/hooks'
import { CheckCircleIcon, InfoIcon } from '@/svgs'

function TxnModal() {
  const { popup, title, transactions, final } = useSelector(state => state.transactions)
  const { closeTxn } = useTxn()

  const txns = useMemo(() => {
    if (!transactions) return []
    return Object.values(transactions)
  }, [transactions])

  return (
    <Modal
      isOpen={popup}
      closeModal={() => {
        closeTxn()
      }}
      width={480}
      zIndex={70}
      title={title}
      shouldCloseOnOverlayClick={false}
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
                {txn.status === TXN_STATUS.FAILED && <InfoIcon className='h-5 w-5 stroke-error-600' />}
              </div>
            ))}
        </div>
        {final && (
          <Info>
            <InfoIcon className='h-4 w-4 stroke-primary-600' />
            <p>All done! You may now close this window.</p>
          </Info>
        )}
      </ModalBody>
    </Modal>
  )
}

export default TxnModal
