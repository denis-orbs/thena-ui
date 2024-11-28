import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import Input from '@/components/input'
import Modal, { ModalBody } from '@/components/modal'
import Selection from '@/components/selection'
import { TextHeading } from '@/components/typography'
import { cn } from '@/lib/utils'

function TransactionSettingModal({ isOpen, setIsOpen, slippageTolerance, setSlippageTolerance }) {
  const t = useTranslations()

  const range = useMemo(
    () => [
      {
        label: '0,1%',
        active: slippageTolerance === 0.1,
        onClickHandler: () => setSlippageTolerance(0.1),
      },
      {
        label: '0,5%',
        active: slippageTolerance === 0.5,
        onClickHandler: () => setSlippageTolerance(0.5),
      },
      {
        label: '1,0%',
        active: slippageTolerance === 1.0,
        onClickHandler: () => setSlippageTolerance(1.0),
      },
    ],
    [setSlippageTolerance, slippageTolerance],
  )

  const isCustom = useMemo(
    () =>
      slippageTolerance !== null && slippageTolerance !== 0.1 && slippageTolerance !== 0.5 && slippageTolerance !== 1,
    [slippageTolerance],
  )
  return (
    <Modal isOpen={isOpen} closeModal={() => setIsOpen(false)} title={t('Transaction settings')}>
      <ModalBody>
        <TextHeading>{t('Slippage tolerance')}</TextHeading>
        <div className='mt-4 flex flex-row justify-between'>
          <Selection className='!h-11' data={range} />
          <Input
            onChange={e => {
              setSlippageTolerance(e.target.value)
            }}
            className={cn('h-11 w-[112px]', isCustom ? 'bg-neutral-700 font-medium text-neutral-200' : '')}
            placeholder='Custom'
            suffix='%'
            classNames={{ input: 'pr-7' }}
            type='number'
          />
        </div>
      </ModalBody>
    </Modal>
  )
}

export default TransactionSettingModal
