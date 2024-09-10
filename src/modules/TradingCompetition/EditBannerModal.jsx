import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import { mutate } from 'swr'

import 'react-image-crop/dist/ReactCrop.css'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Modal, { ModalBody } from '@/components/modal'
import Spinner from '@/components/spinner'
import { TextSubHeading } from '@/components/typography'
import { useUserInfo } from '@/context/userInfoContext'
import useDebounce from '@/hooks/useDebounce'
import { useCreatePresignedUrl } from '@/hooks/useUploadFile'
import { errorToast, successToast } from '@/lib/notify'

import { canvasPreview } from './canvasPreview'
import { resizeFile, useUpdateTCBanner } from '../Arena/hooks/competitions'

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

const aspect = 16 / 9

export function EditBannerModal({ competition, open, onClose }) {
  const t = useTranslations()
  const { userInfo } = useUserInfo()

  const [selectedImage, setSelectedImage] = useState(competition.bannerUrl)
  const [loading, setLoading] = useState(false)
  const [stateChecked, setStateChecked] = useState(competition.bannerUrl ? 'custom' : 'default')
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState()
  const [initImage, setInitImage] = useState()

  const previewCanvasRef = useRef(null)
  const imgRef = useRef(null)

  const debounceCompleteCrop = useDebounce(completedCrop, 100)

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    multiple: false,
    accept: { 'image/*': [] },
  })

  const { createPresignedUrl } = useCreatePresignedUrl()
  const { updateTCBanner } = useUpdateTCBanner()

  const handleUpdateTCBanner = useCallback(
    async bannerUrl => {
      await updateTCBanner(
        { bannerUrl, tcId: competition.id },
        newData => {
          if (newData !== false) {
            successToast('Successfully')
            mutate('competition detail api')
            onClose()
          }
          setLoading(false)
        },
        () => setLoading(false),
      )
    },
    [competition?.id, onClose, updateTCBanner],
  )

  const handleUploadBannerAndUpdateTC = useCallback(
    async file => {
      if (userInfo?.id && competition?.id) {
        setLoading(true)
        if (stateChecked === 'default') {
          await handleUpdateTCBanner(null)
        } else {
          // Resize before upload
          let resizedFile = ''
          try {
            resizedFile = await resizeFile(file)
          } catch (error) {
            console.log(error)
            errorToast('Error')
            setLoading(false)
            return
          }

          if (resizedFile) {
            await createPresignedUrl(
              resizedFile,
              userInfo.id,
              'BANNER',
              async data => {
                if (data !== false) {
                  await handleUpdateTCBanner(data)
                } else {
                  setLoading(false)
                }
              },
              () => {
                setLoading(false)
              },
            )
          } else {
            errorToast('Error')
            setLoading(false)
          }
        }
      }
    },
    [competition?.id, createPresignedUrl, handleUpdateTCBanner, stateChecked, userInfo.id],
  )

  const exportCropToNewImage = useCallback(
    async callbackFn => {
      const image = imgRef.current
      const previewCanvas = previewCanvasRef.current
      if (!image || !previewCanvas || !completedCrop) {
        errorToast('Crop canvas does not exist', null, null, false)
      }

      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height

      const offscreen = document.createElement('canvas')
      offscreen.width = completedCrop.width * scaleX
      offscreen.height = completedCrop.height * scaleY

      const ctx = offscreen.getContext('2d')
      if (!ctx) {
        errorToast('No 2d context', null, null, false)
      }

      ctx.drawImage(
        previewCanvas,
        0,
        0,
        previewCanvas.width,
        previewCanvas.height,
        0,
        0,
        offscreen.width,
        offscreen.height,
      )

      offscreen.toBlob(blob => {
        const [originName, extension] = selectedImage.name.split('.')
        const timeStamp = dayjs().unix()
        const newName = `${originName}-${timeStamp}.${extension}`

        const file = new File([blob], newName, { type: selectedImage.type })
        callbackFn(file)
      }, selectedImage.type)
    },
    [completedCrop, selectedImage],
  )

  const handleSave = useCallback(() => {
    exportCropToNewImage(handleUploadBannerAndUpdateTC)
  }, [handleUploadBannerAndUpdateTC, exportCropToNewImage])

  useEffect(() => {
    if (acceptedFiles.length) {
      setSelectedImage(acceptedFiles[0])
      const reader = new FileReader()
      reader.onload = () => {
        const dataURL = reader.result
        setInitImage(dataURL)
      }
      reader.readAsDataURL(acceptedFiles[0])
    }
  }, [acceptedFiles, setInitImage])

  useEffect(() => {
    if (debounceCompleteCrop?.width && debounceCompleteCrop?.height && imgRef.current && previewCanvasRef.current) {
      canvasPreview(imgRef.current, previewCanvasRef.current, debounceCompleteCrop, 1, 0)
    }
  }, [debounceCompleteCrop])

  return (
    <Modal isOpen={open} closeModal={onClose} width={540} title={t('Edit banner')}>
      <ModalBody>
        <div className='flex flex-row items-center justify-center gap-4'>
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
            <TextSubHeading>{t('Use Banner Default')}</TextSubHeading>
          </div>
          <div className='flex cursor-pointer items-center gap-4 p-2' onClick={() => setStateChecked('custom')}>
            {stateChecked === 'custom' ? (
              <div className='h-4 w-4 rounded-full bg-primary-600 p-1'>
                <div className='h-2 w-2 rounded-full bg-white' />
              </div>
            ) : (
              <div className='h-4 w-4 rounded-full border border-neutral-600' />
            )}
            <TextSubHeading>{t('Use Custom Banner')}</TextSubHeading>
          </div>
        </div>

        {stateChecked === 'custom' && (
          <>
            <p className='mb-3'>Note: You should use image with 16:9 ratio (For example: 1920x1080)</p>
            <div
              className='mb-2 w-full rounded-xl border border-primary-800 bg-neutral-900 px-4 py-6 lg:p-6'
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

            {Boolean(completedCrop) && <canvas hidden ref={previewCanvasRef} className=' object-contain' />}
          </>
        )}
        <div className='mt-2 flex w-full flex-row items-center gap-2'>
          <EmphasisButton className='w-full' onClick={onClose}>
            {t('Cancel')}
          </EmphasisButton>
          <PrimaryButton className='flex w-full gap-1' onClick={handleSave} disabled={loading}>
            {loading && <Spinner />}
            {t('Save Change')}
          </PrimaryButton>
        </div>
      </ModalBody>
    </Modal>
  )
}
