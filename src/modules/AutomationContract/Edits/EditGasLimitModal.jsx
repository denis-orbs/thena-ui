import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import ErrorInfo from '@/components/common/ErrorInfo'
import Input from '@/components/input'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { Paragraph, TextHeading } from '@/components/typography'
import { useAutomationContractDetail, useEditGasLimit } from '@/hooks/automationContract/useAutomationContract'

function EditGasLimitModal({ contract, popup, setPopup }) {
  const { veTHEId } = contract
  const t = useTranslations()
  const [gasLimit, setGasLimit] = useState(contract.gasLimit || '')
  const { mutateAutomationData } = useAutomationContractDetail(veTHEId)
  const { onEditGasLimit, pending } = useEditGasLimit()
  return (
    <Modal
      isOpen={popup}
      closeModal={() => {
        setPopup(false)
      }}
      width={480}
      title='Edit gas limit'
    >
      <ModalBody>
        <div className='flex flex-col gap-3'>
          <div className='flex flex-row justify-between'>
            <Paragraph>{t('Contract Name')}</Paragraph>
            <TextHeading>{t('veTHE Contract [veTHEId]', { veTHEId })}</TextHeading>
          </div>
          <div className='flex flex-col gap-[11px]'>
            <TextHeading>{t('Gas limit')}</TextHeading>
            <Input val={gasLimit} onChange={e => setGasLimit(Number(e.target.value))} />
            <ErrorInfo className='lg:p-4' message={t('Edit automation gas limit warning')} showIcon={false} />
          </div>
        </div>
      </ModalBody>
      <ModalFooter className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <EmphasisButton className='w-full' onClick={() => setPopup()}>
          {t('Cancel')}
        </EmphasisButton>
        <PrimaryButton
          className='w-full'
          disabled={pending || Number(gasLimit) < 500000}
          onClick={() => {
            onEditGasLimit(contract.address, gasLimit, () => {
              mutateAutomationData()
            })
            setPopup(false)
          }}
        >
          {t('Change Gas limit')}
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  )
}

export default EditGasLimitModal
