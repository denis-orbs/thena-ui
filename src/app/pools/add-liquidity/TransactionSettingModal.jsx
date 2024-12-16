import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import Input from '@/components/input'
import Modal, { ModalBody } from '@/components/modal'
import Selection from '@/components/selection'

const slippageTolerance = [0.1, 0.5, 1]
function TransactionSettingModal({ isOpen, setIsOpen, slippage, updateSlippage }) {
  const t = useTranslations()

  const selections = useMemo(
    () =>
      slippageTolerance.map(ele => ({
        label: ele,
        active: slippage === Number(ele),
        onClickHandler: () => {
          updateSlippage(Number(ele))
        },
      })),
    [slippage, updateSlippage],
  )

  return (
    <Modal
      isOpen={isOpen}
      closeModal={() => {
        setIsOpen(false)
      }}
      width={480}
      title='Transaction Settings'
    >
      <ModalBody>
        <div className='flex w-full flex-col items-start justify-start gap-3'>
          <p className='text-lg font-medium'>{t('Slippage Tolerance')}</p>
          <div className='inline-flex w-full justify-between'>
            <Selection data={selections} />
            <Input
              classNames={{
                input: 'w-[110px]',
              }}
              val={slippage}
              onChange={e => updateSlippage(Number(e.target.value) || 0)}
              suffix='%'
            />
          </div>
        </div>
      </ModalBody>
    </Modal>
  )
}

export default TransactionSettingModal
