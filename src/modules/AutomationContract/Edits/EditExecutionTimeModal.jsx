import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { useSetRunTimestamp } from '@/hooks/automationContract/useAutomationContract'
import { useWindowSize } from '@/hooks/useWindowSize'
import SelectExecutionTime from '@/modules/CreateVeTHEAutomation/SelectExecutionTime'

const getExecutionTime = startTime => {
  const nowUTC = Date.now()

  let rawExecutionTime = startTime || 0

  while (rawExecutionTime < nowUTC) {
    rawExecutionTime += 7 * 24 * 60 * 60 * 1000
  }
  return rawExecutionTime
}

function EditExecutionTimeModal({ popup, setPopup, contract }) {
  const t = useTranslations()
  const { onSetRunTimestamp, pending } = useSetRunTimestamp()

  const [executionTime, setExecutionTime] = useState(getExecutionTime(contract?.settings?.executionTime))

  const windowSize = useWindowSize()

  return (
    <Modal
      isOpen={popup}
      closeModal={() => {
        setPopup(false)
      }}
      width={windowSize.width > 768 ? 616 : 480}
      title='Edit Automation Execution Time'
    >
      <ModalBody>
        <SelectExecutionTime isModal executionTime={executionTime} updateData={date => setExecutionTime(date)} />
      </ModalBody>
      <ModalFooter className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <EmphasisButton className='w-full' onClick={() => setPopup()}>
          {t('Cancel')}
        </EmphasisButton>
        <PrimaryButton
          className='w-full'
          disabled={pending}
          onClick={() => {
            onSetRunTimestamp(contract.address, executionTime)
            setPopup(false)
          }}
        >
          {t('Save Changes')}
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  )
}

export default EditExecutionTimeModal
