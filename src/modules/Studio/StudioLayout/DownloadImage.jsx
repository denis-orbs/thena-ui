import html2canvas from 'html2canvas-pro'
import { useTranslations } from 'next-intl'
import React, { useCallback, useState } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import { useCreatePresignedUrl } from '@/hooks/useUploadFile'
import useWallet from '@/hooks/useWallet'
import { cn, rewriteS3Host } from '@/lib/utils'

import DownloadIcon from '~/svgs/download.svg'

// Utility function for delays
const delay = ms =>
  new Promise(resolve => {
    setTimeout(resolve, ms)
  })

function DownloadImage({ fileName, scale = 1, backgroundColor = '#0B040D', shouldUseS3Upload, className }) {
  const t = useTranslations()
  const { account } = useWallet()
  const { createPresignedUrl } = useCreatePresignedUrl()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadS3Image = useCallback(
    async imageUrl => {
      try {
        const tempLink = document.createElement('a')
        tempLink.href = `/s3/download/${rewriteS3Host(imageUrl, 'cdn.thena.fi/')}`
        tempLink.download = `${fileName}.png`
        tempLink.click()

        // Wait a bit to ensure download started
        await delay(1000)
      } catch (error) {
        console.error('Error downloading S3 image:', error)
        throw error
      }
    },
    [fileName],
  )

  const uploadToS3AndDownload = useCallback(
    async blob => {
      if (!account) {
        throw new Error('Account not available')
      }

      return new Promise((resolve, reject) => {
        createPresignedUrl(blob, account.toLowerCase(), 'CONTENT_STUDIO', data => {
          handleDownloadS3Image(data)
            .then(() => resolve())
            .catch(error => reject(error))
        })
      })
    },
    [account, createPresignedUrl, handleDownloadS3Image],
  )

  const directDownload = useCallback(
    async blob => {
      try {
        const tempLink = document.createElement('a')
        tempLink.href = URL.createObjectURL(blob)
        tempLink.download = `${fileName}.png`
        tempLink.target = '_blank'
        tempLink.click()

        // Clean up the object URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(tempLink.href)
        }, 1000)

        // Wait a bit to ensure download started
        await delay(500)
      } catch (error) {
        console.error('Error with direct download:', error)
        throw error
      }
    },
    [fileName],
  )

  const handleRender = async () => {
    if (isDownloading) return

    setIsDownloading(true)

    try {
      const originShare = document.getElementById('share-origin')

      if (!originShare) {
        throw new Error('Share element not found')
      }

      const canvas = await html2canvas(originShare, {
        width: 1024,
        height: 576,
        scale,
        allowTaint: true,
        useCORS: true,
        removeContainer: true,
        backgroundColor,
        onclone(clonedDoc) {
          const clonedElement = clonedDoc.getElementById('share-origin')
          if (clonedElement) {
            clonedElement.style.display = 'block'
            clonedElement.style.width = '1024px'
            clonedElement.style.height = '576px'
            clonedElement.style.borderRadius = 'none'
          }
        },
      })

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(_blob => {
          if (!_blob) {
            reject(new Error('Failed to create image blob'))
          } else {
            resolve(_blob)
          }
        })
      })

      if (shouldUseS3Upload) {
        const file = new File([blob], `${fileName}.png`, { type: 'image/png' })
        await uploadToS3AndDownload(file)
      } else {
        await directDownload(blob)
      }
    } catch (error) {
      console.error('Error processing image download:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <EmphasisButton onClick={handleRender} className={cn('h-full w-1/2', className)} disabled={isDownloading}>
      {isDownloading ? (
        <>
          <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
          {`${t('Downloading')}...`}
        </>
      ) : (
        <>
          <DownloadIcon className='size-4' />
          {t('Download')}
        </>
      )}
    </EmphasisButton>
  )
}

export default DownloadImage
