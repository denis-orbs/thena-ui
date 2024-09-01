import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { mutate } from 'swr'

import { CompetitionCardHeader } from '@/app/arena/CompetitionCardHeader'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Modal, { ModalBody } from '@/components/modal'
import Spinner from '@/components/spinner'
import { TextSubHeading } from '@/components/typography'
import { useUserInfo } from '@/context/userInfoContext'
import { useCreatePresignedUrl } from '@/hooks/useUploadFile'
import { errorToast, successToast } from '@/lib/notify'

import { resizeFile, useUpdateTCBanner } from '../Arena/hooks/competitions'

export function EditBannerModal({ competition, open, onClose }) {
  const t = useTranslations()
  const { userInfo } = useUserInfo()

  const [selectedImage, setSelectedImage] = useState(competition.bannerUrl)
  const [loading, setLoading] = useState(false)
  const [stateChecked, setStateChecked] = useState(competition.bannerUrl ? 'custom' : 'default')

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

  const handleSave = useCallback(async () => {
    if (userInfo?.id && competition?.id) {
      setLoading(true)
      if (stateChecked === 'default') {
        await handleUpdateTCBanner(null)
      } else {
        // Resize before upload
        let resizedFile = ''
        try {
          resizedFile = await resizeFile(selectedImage)
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
  }, [competition?.id, createPresignedUrl, handleUpdateTCBanner, selectedImage, stateChecked, userInfo.id])

  useEffect(() => {
    if (acceptedFiles.length) {
      setSelectedImage(acceptedFiles[0])
    }
  }, [acceptedFiles, setSelectedImage])

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
            <div
              className='mb-2 w-full rounded-xl border border-primary-800 bg-neutral-900 px-4 py-6 lg:p-6'
              {...getRootProps()}
            >
              <input {...getInputProps()} />
              {isDragActive ? <p>{t('Drop The File Here')}</p> : <p>{t('Drag Drop File Here')}</p>}
            </div>
            {selectedImage && (
              <CompetitionCardHeader
                className='h-60 w-full rounded-xl'
                competition={competition}
                banner={selectedImage}
              />
            )}
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
