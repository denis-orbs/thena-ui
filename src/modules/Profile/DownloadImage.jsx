'use client'

import html2canvas from 'html2canvas-pro'
import { useTranslations } from 'next-intl'
import { useCallback } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import { useCreatePresignedUrl } from '@/hooks/useUploadFile'
import useWallet from '@/hooks/useWallet'
import { useWindowSize } from '@/hooks/useWindowSize'
import { rewriteS3Host } from '@/lib/utils'
import { DownloadIcon } from '@/svgs'

export default function DownloadButton({ fileName }) {
  const t = useTranslations()
  const { account } = useWallet()
  const { createPresignedUrl } = useCreatePresignedUrl()

  const windowSize = useWindowSize()

  const handleDownloadS3Image = useCallback(
    async imageUrl => {
      const tempLink = document.createElement('a')
      tempLink.href = `/s3/download/${rewriteS3Host(imageUrl, 'cdn-s3.thena.fi/')}`
      tempLink.download = `${fileName}.png`
      tempLink.click()
    },
    [fileName],
  )

  const uploadToS3AndDownload = useCallback(
    async blob => {
      if (account) {
        await createPresignedUrl(blob, account.toLowerCase(), 'PROFILE', async data => {
          handleDownloadS3Image(data)
        })
      }
    },
    [account, createPresignedUrl, handleDownloadS3Image],
  )

  const handleRender = async () => {
    const originShare = document.getElementById('share-origin') || null
    if (originShare) {
      const canvas = await html2canvas(originShare, {
        width: 1024,
        height: 576,
        scale: 1,
        allowTaint: true,
        useCORS: true,
        removeContainer: true,
        backgroundColor: '#0B040D',
        onclone(clonedDoc) {
          clonedDoc.getElementById('share-origin').style.display = 'block'
          clonedDoc.getElementById('share-origin').style.width = '1024px'
          clonedDoc.getElementById('share-origin').style.width = '576px'
        },
      })

      canvas.toBlob(blob => {
        if (windowSize.width >= 1024) {
          // If PC: Direct download
          const tempLink = document.createElement('a')
          tempLink.href = URL.createObjectURL(blob)
          tempLink.download = `${fileName}.png`
          tempLink.target = '_blank'
          tempLink.click()
        } else {
          const file = new File([blob], `${fileName}.png`, { type: 'image/jpeg' })
          uploadToS3AndDownload(file)
        }
      })
    }
  }

  return (
    <PrimaryButton onClick={handleRender} className='w-full'>
      <DownloadIcon className='mr-2 h-4 w-4' />
      {t('Download image')}
    </PrimaryButton>
  )
}
