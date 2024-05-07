import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { mutate } from 'swr'

import { CompetitionCardHeader } from '@/app/arena/CompetitionCardHeader'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Modal, { ModalBody } from '@/components/modal'
import { TextSubHeading } from '@/components/typography'
import { useUserInfo } from '@/context/userInfoContext'
import { useUploadBanner } from '@/hooks/useUploadFile'
import { successToast } from '@/lib/notify'

export function EditBannerModal({ competition, open, onClose }) {
  const t = useTranslations()
  const [selectedImage, setSelectedImage] = useState(competition.bannerUrl)
  const [loading, setLoading] = useState(false)
  const { uploadBanner } = useUploadBanner()
  const [stateChecked, setStateChecked] = useState(competition.bannerUrl ? 'custom' : 'default')
  const { userInfo } = useUserInfo()

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    multiple: false,
    accept: { 'image/*': [] },
  })
  const handleSave = useCallback(async () => {
    if (userInfo?.id && competition?.id) {
      setLoading(true)
      uploadBanner(selectedImage, userInfo.id, competition.id, async () => {
        successToast('Successfully')
        await mutate('competition detail api')
        setLoading(false)
        onClose()
      })
    }
  }, [userInfo?.id, competition?.id, onClose, selectedImage, uploadBanner])

  useEffect(() => {
    if (acceptedFiles.length) {
      setSelectedImage(acceptedFiles[0])
    }
  }, [acceptedFiles, setSelectedImage])

  return (
    <Modal isOpen={open} closeModal={onClose} width={540} title={t('Edit Banner')}>
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
          <PrimaryButton className='w-full' onClick={handleSave} disabled={loading}>
            {t('Save Change')}
          </PrimaryButton>
        </div>
      </ModalBody>
    </Modal>
  )
}
