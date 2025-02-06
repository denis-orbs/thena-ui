import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Input from '@/components/input'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { Paragraph, TextHeading } from '@/components/typography'
import { useAutomationContractDetail, useEditMaxGasPrice } from '@/hooks/automationContract/useAutomationContract'

function EditMaxGasPriceModal({ contract, popup, setPopup }) {
  const { veTHEId } = contract
  const t = useTranslations()
  const [maxGas, setMaxGas] = useState(contract.maxGas)
  const { mutateAutomationData } = useAutomationContractDetail(veTHEId)
  const { onEditMaxGasPrice, pending } = useEditMaxGasPrice()
  return (
    <Modal
      isOpen={popup}
      closeModal={() => {
        setPopup(false)
      }}
      width={480}
      title='Edit max gas price'
    >
      <ModalBody>
        <div className='space-y-3'>
          <div className='flex flex-row justify-between'>
            <Paragraph>{t('Contract Name')}</Paragraph>
            <TextHeading>{t('veTHE Contract [veTHEId]', { veTHEId })}</TextHeading>
          </div>
          <div className='flex flex-col gap-[11px]'>
            <TextHeading>{t('Max Gas')}</TextHeading>
            <Input val={maxGas} onChange={e => setMaxGas(Number(e.target.value))} />
            {/* <ErrorMessage className='lg:p-4' message={t('Edit automation gas limit warning')} showIcon={false} /> */}
          </div>
        </div>
      </ModalBody>
      <ModalFooter className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <EmphasisButton className='w-full' onClick={() => setPopup()}>
          {t('Cancel')}
        </EmphasisButton>
        <PrimaryButton
          className='w-full'
          disabled={pending}
          onClick={() => {
            onEditMaxGasPrice(contract.address, maxGas, () => {
              mutateAutomationData()
            })
            setPopup(false)
          }}
        >
          {t('Change max gas price')}
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  )
}

export default EditMaxGasPriceModal
