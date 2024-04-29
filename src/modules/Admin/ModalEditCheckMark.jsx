import { gql } from 'graphql-request'
import { isString } from 'lodash'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { UserProfileCard } from '@/components/image/UserProfileCard'
import Modal, { ModalBody } from '@/components/modal'
import { TextSubHeading } from '@/components/typography'
import { v4Client } from '@/lib/graphql'
import { getFromSessionStorage } from '@/lib/helper'
import { errorToast, successToast } from '@/lib/notify'
import { sliceAddress } from '@/lib/utils'

const V4_UPDATE_CHECKMARK = gql`
  mutation V4_UPDATE_CHECKMARK($file: Upload!) {
    uploadCheckMarkIcon(file: $file)
  }
`

function ModalEditCheckMark({ isOpen, mutate, closeModal = () => {}, user = {} }) {
  const t = useTranslations()
  const [stateChecked, setStateChecked] = useState('default')
  const [selectedImage, setSelectedImage] = useState(undefined)

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    multiple: false,
    accept: { 'image/*': [] },
  })

  const handleSave = useCallback(async () => {
    try {
      if (user?.id) {
        await v4Client.request(
          V4_UPDATE_CHECKMARK,
          {
            file: selectedImage,
            userId: user.id,
          },
          {
            authorization: getFromSessionStorage('token') ? `Bearer ${getFromSessionStorage('token')}` : '',
          },
        )

        successToast('Successfully')
        closeModal()
        await mutate()
      }
    } catch (error) {
      errorToast('Error')
      console.error(error)
    }
  }, [selectedImage, user?.id, mutate, closeModal])

  useEffect(() => {
    if (acceptedFiles.length) {
      setSelectedImage(acceptedFiles[0])
    } else {
      setSelectedImage(undefined)
    }
  }, [acceptedFiles])

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
              <div
                className='flex cursor-pointer items-center gap-4 p-2'
                onClick={() => {
                  setStateChecked('default')
                  setSelectedImage(undefined)
                }}
              >
                {stateChecked === 'default' ? (
                  <div className='h-4 w-4 rounded-full bg-primary-600 p-1'>
                    <div className='h-2 w-2 rounded-full bg-white' />
                  </div>
                ) : (
                  <div className='h-4 w-4 rounded-full border border-neutral-600' />
                )}
                <TextSubHeading>{t('Use Checkmark Default')}</TextSubHeading>
              </div>
              <div className='flex cursor-pointer items-center gap-4 p-2' onClick={() => setStateChecked('custom')}>
                {stateChecked === 'custom' ? (
                  <div className='h-4 w-4 rounded-full bg-primary-600 p-1'>
                    <div className='h-2 w-2 rounded-full bg-white' />
                  </div>
                ) : (
                  <div className='h-4 w-4 rounded-full border border-neutral-600' />
                )}
                <TextSubHeading>{t('Use Custom Checkmark')}</TextSubHeading>
              </div>
            </div>

            {stateChecked === 'custom' && (
              <>
                <div
                  className='w-full rounded-xl border border-primary-800 bg-neutral-900 px-4 py-6 lg:p-6'
                  {...getRootProps()}
                >
                  <input {...getInputProps()} />
                  {isDragActive ? <p>{t('Drop The File Here')}</p> : <p>{t('Drag Drop File Here')}</p>}
                </div>
                {selectedImage && (
                  <UserProfileCard
                    avatar={user.avatar}
                    id={user.id}
                    showVerified
                    disableLink
                    verifyImage={isString(selectedImage) ? selectedImage : URL.createObjectURL(selectedImage)}
                  />
                )}
              </>
            )}
            {stateChecked === 'default' && (
              <UserProfileCard avatar={user.avatar} id={user.id} showVerified disableLink />
            )}

            <div className='mt-2 flex w-full flex-row items-center gap-2'>
              <EmphasisButton className='w-full' onClick={closeModal}>
                {t('Cancel')}
              </EmphasisButton>
              <PrimaryButton className='w-full' onClick={handleSave}>
                {t('Save Change')}
              </PrimaryButton>
            </div>
          </div>
        ) : null}
      </ModalBody>
    </Modal>
  )
}

export default ModalEditCheckMark
