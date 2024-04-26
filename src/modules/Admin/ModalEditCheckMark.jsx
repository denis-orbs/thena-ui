import { useTranslations } from 'next-intl'
import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Modal, { ModalBody } from '@/components/modal'
import { TextSubHeading } from '@/components/typography'
import { sliceAddress } from '@/lib/utils'

function ModalEditCheckMark({ isOpen, closeModal = () => {}, user = {} }) {
  const t = useTranslations()
  const [stateChecked, setStateChecked] = useState('default')

  const onDrop = useCallback(acceptedFiles => {
    console.log(acceptedFiles)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  return (
    <Modal isOpen={isOpen} closeModal={closeModal} width={600} title='Edit checkmark'>
      <ModalBody className='py-0'>
        {user && user.id ? (
          <div className='flex flex-col items-center gap-3'>
            <TextSubHeading>
              {t('Are you sure you want to edit checkmark for user')}
              <span className='font-semibold text-white'> {user.username || sliceAddress(user.id)}</span>
            </TextSubHeading>
            <div className='flex w-full flex-row items-center justify-between'>
              <div className='flex w-full flex-row items-center gap-2'>
                <input
                  name='theme-radio'
                  type='radio'
                  checked={stateChecked === 'default'}
                  onChange={() => setStateChecked('default')}
                />
                <TextSubHeading>Use checkmark default</TextSubHeading>
              </div>
              <div className='flex w-full flex-row items-center gap-2'>
                <input
                  name='theme-radio'
                  type='radio'
                  checked={stateChecked === 'custom'}
                  onChange={() => setStateChecked('custom')}
                />
                <TextSubHeading>Use custom checkmark</TextSubHeading>
              </div>
            </div>

            <div
              className='w-full rounded-xl border border-primary-800 bg-neutral-900 px-4 py-6 lg:p-6'
              {...getRootProps()}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p>Drop the files here ...</p>
              ) : (
                <p>Drag 'n' drop some files here, or click to select files</p>
              )}
              {/* {file && fileName && <Image width={50} height={50} src={fileUrl} />} */}
            </div>

            <div className='mt-2 flex w-full flex-row items-center gap-2'>
              <EmphasisButton className='w-full'>{t('Cancel')}</EmphasisButton>
              <PrimaryButton className='w-full'>Save Change</PrimaryButton>
            </div>
          </div>
        ) : null}
      </ModalBody>
    </Modal>
  )
}

export default ModalEditCheckMark
