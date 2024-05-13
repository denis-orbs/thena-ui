import { isString } from 'lodash'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import Modal, { ModalBody } from '@/components/modal'
import { TextSubHeading } from '@/components/typography'
import { useUpdateAvatar } from '@/hooks/useUploadFile'
import { sliceAddress } from '@/lib/utils'

export function ModalEditUserAvatar({ isOpen, mutate, closeModal = () => {}, user = {} }) {
  const t = useTranslations()
  const [stateChecked, setStateChecked] = useState('default')
  const [selectedImage, setSelectedImage] = useState(undefined)
  const [loading, setLoading] = useState(false)
  const { uploadAvatar } = useUpdateAvatar()
  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    multiple: false,
    accept: { 'image/*': [] },
  })

  const handleSave = useCallback(async () => {
    setLoading(true)
    if (user?.id) {
      await uploadAvatar(selectedImage, user, async () => {
        await mutate()
        setLoading(false)
        closeModal()
      })
    }
  }, [user, uploadAvatar, selectedImage, mutate, closeModal])

  useEffect(() => {
    if (acceptedFiles.length) {
      setSelectedImage(acceptedFiles[0])
    } else {
      setSelectedImage(undefined)
    }
  }, [acceptedFiles])

  return (
    <Modal isOpen={isOpen} closeModal={closeModal} width={600} title='Edit Avatar'>
      <ModalBody className='py-0'>
        {user && user.id ? (
          <div className='flex flex-col items-center gap-3'>
            <TextSubHeading>
              {t('Are You Sure You Want To Edit Avatar For User')}
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
                <TextSubHeading>{t('Use Avatar Default')}</TextSubHeading>
              </div>
              <div className='flex cursor-pointer items-center gap-4 p-2' onClick={() => setStateChecked('custom')}>
                {stateChecked === 'custom' ? (
                  <div className='h-4 w-4 rounded-full bg-primary-600 p-1'>
                    <div className='h-2 w-2 rounded-full bg-white' />
                  </div>
                ) : (
                  <div className='h-4 w-4 rounded-full border border-neutral-600' />
                )}
                <TextSubHeading>{t('Use Custom Avatar')}</TextSubHeading>
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
                  <CircleImage
                    src={isString(selectedImage) ? selectedImage : URL.createObjectURL(selectedImage)}
                    alt='avatar'
                    className='h-24 w-24'
                  />
                )}
              </>
            )}
            {stateChecked === 'default' && <CircleImage src={Avatar} alt='avatar' className='h-24 w-24' />}

            <div className='mt-2 flex w-full flex-row items-center gap-2'>
              <EmphasisButton className='w-full' onClick={closeModal}>
                {t('Cancel')}
              </EmphasisButton>
              <PrimaryButton className='w-full' onClick={handleSave} disabled={loading}>
                {t('Save Change')}
              </PrimaryButton>
            </div>
          </div>
        ) : null}
      </ModalBody>
    </Modal>
  )
}
