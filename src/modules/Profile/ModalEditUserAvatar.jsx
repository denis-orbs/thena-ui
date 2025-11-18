import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import ReactCrop from 'react-image-crop'

import 'react-image-crop/dist/ReactCrop.css'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import Modal, { ModalBody } from '@/components/modal'
import { TextSubHeading } from '@/components/typography'
import { centerAspectCrop, useCropImage } from '@/hooks/useCropImages'
import { useCreatePresignedUrl } from '@/hooks/useUploadFile'
import useWallet from '@/hooks/useWallet'
import { sliceAddress } from '@/utils/utils'

import { useUpdateArenaAvatar } from '../Arena/hooks/profile'

const aspect = 1 / 1
export function ModalEditUserAvatar({ isOpen, onChange, closeModal = () => {}, user = {} }) {
  const t = useTranslations()
  const { account } = useWallet()

  const [stateChecked, setStateChecked] = useState('default')
  const [selectedImage, setSelectedImage] = useState(undefined)
  const [loading, setLoading] = useState(false)
  const {
    initImage,
    setInitImage,
    completedCrop,
    setCompletedCrop,
    crop,
    setCrop,
    previewCanvasRef,
    imgRef,
    exportCropToNewImage,
  } = useCropImage(aspect, selectedImage)

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    multiple: false,
    accept: { 'image/*': [] },
  })

  const { createPresignedUrl } = useCreatePresignedUrl()
  const { updateArenaAvatar } = useUpdateArenaAvatar(
    account?.toLowerCase() !== user?.id?.toLowerCase() ? user?.id : null,
  )

  const handleUpdateAvatar = useCallback(
    async avatarUrl => {
      await updateArenaAvatar(
        avatarUrl,
        newData => {
          if (newData !== false) {
            onChange(newData.avatar)
            closeModal()
          }
          setLoading(false)
        },
        () => setLoading(false),
      )
    },
    [closeModal, onChange, updateArenaAvatar],
  )

  const handleUploadAndUpadateAvatar = useCallback(
    async file => {
      await createPresignedUrl(
        file,
        user.id,
        'CUSTOM_AVATAR',
        async data => {
          if (data !== false) {
            await handleUpdateAvatar(data)
          } else {
            setLoading(false)
          }
        },
        () => {
          setLoading(false)
        },
      )
    },
    [createPresignedUrl, handleUpdateAvatar, user.id],
  )

  const handleSave = useCallback(async () => {
    if (user?.id) {
      setLoading(true)
      if (stateChecked === 'default') {
        await handleUpdateAvatar(null)
      } else {
        await exportCropToNewImage(handleUploadAndUpadateAvatar)
      }
    }
  }, [handleUpdateAvatar, stateChecked, user.id, exportCropToNewImage, handleUploadAndUpadateAvatar])

  useEffect(() => {
    if (acceptedFiles.length) {
      setSelectedImage(acceptedFiles[0])
      const reader = new FileReader()
      reader.onload = () => {
        const dataURL = reader.result
        setInitImage(dataURL)
      }
      reader.readAsDataURL(acceptedFiles[0])
    } else {
      setSelectedImage(undefined)
    }
  }, [acceptedFiles, setInitImage])

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
                  <div className='bg-primary-600 h-4 w-4 rounded-full p-1'>
                    <div className='h-2 w-2 rounded-full bg-white' />
                  </div>
                ) : (
                  <div className='h-4 w-4 rounded-full border border-neutral-600' />
                )}
                <TextSubHeading>{t('Use Avatar Default')}</TextSubHeading>
              </div>
              <div className='flex cursor-pointer items-center gap-4 p-2' onClick={() => setStateChecked('custom')}>
                {stateChecked === 'custom' ? (
                  <div className='bg-primary-600 h-4 w-4 rounded-full p-1'>
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
                <p className='mb-3'>Note: You should use image with 1:1 ratio (For example: 300x300)</p>
                <div
                  className='border-primary-800 w-full rounded-xl border bg-neutral-900 px-4 py-6 lg:p-6'
                  {...getRootProps()}
                >
                  <input {...getInputProps()} />
                  {isDragActive ? <p>{t('Drop The File Here')}</p> : <p>{t('Drag Drop File Here')}</p>}
                </div>
                {Boolean(initImage) && (
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={c => setCompletedCrop(c)}
                    aspect={aspect}
                    minWidth={300}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      ref={imgRef}
                      alt='Crop me'
                      src={initImage}
                      onLoad={e => {
                        const { width, height } = e.currentTarget
                        setCrop(centerAspectCrop(width, height, aspect))
                      }}
                    />
                  </ReactCrop>
                )}

                {Boolean(completedCrop) && <canvas hidden ref={previewCanvasRef} className='object-contain' />}
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
