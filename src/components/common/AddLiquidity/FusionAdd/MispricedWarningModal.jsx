import { useTranslations } from 'next-intl'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Highlight from '@/components/highlight'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { TextHeading } from '@/components/typography'
import InfoIcon from '@/icons/InfoIcon'

export default function MispricedWarningModal({ isOpen, onCancel, onConfirm }) {
  const t = useTranslations()

  return (
    <Modal isOpen={isOpen} closeModal={onCancel} width={480} title={t('Attention')}>
      <ModalBody>
        <div className='flex w-full flex-col items-center justify-center gap-4 px-6'>
          <Highlight className='bg-error-500'>
            <InfoIcon className='stroke-neutral-50' />
          </Highlight>
          <div className='flex flex-col items-center gap-3'>
            <TextHeading className='mt-3 text-center'>{t('Mispriced warning message')}</TextHeading>
            <TextHeading className='mt-3 text-center'>{t('Mispriced warning message subtitle')}</TextHeading>
          </div>
        </div>
      </ModalBody>
      <ModalFooter className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <EmphasisButton className='w-full' onClick={onCancel}>
          {t('Cancel')}
        </EmphasisButton>
        <PrimaryButton className='w-full' onClick={onConfirm}>
          {t('Continue')}
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  )
}
