import NextImage from 'next/image'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'

import { TextHeading, TextSubHeading } from '@/components/typography'
import { errorToast } from '@/lib/notify'
import cn from '@/utils/classes'

import LogoIcon from '~/logo.svg'

export default function PreviewCanvas({ children, background, setField, className }) {
  const parentRef = useRef(null)
  const childRef = useRef(null)
  const [scale, setScale] = useState(1)
  const t = useTranslations()
  const [isDragOver, setIsDragOver] = useState(false)
  const imgInputRef = useRef(null)
  const [imageSize, setImageSize] = useState({ w: 1920, h: 1080 })

  const backgroundImage = useMemo(() => (background.value ? `url(${background.value})` : 'none'), [background.value])
  // useFixViewport(parentRef, childRef)
  useEffect(() => {
    const calculateScale = () => {
      if (parentRef.current) {
        const parentRect = parentRef.current.getBoundingClientRect()
        const availableWidth = parentRect.width
        const availableHeight = parentRect.height

        const baseWidth = 1024
        const baseHeight = 576

        const scaleX = availableWidth / baseWidth
        const scaleY = availableHeight / baseHeight

        const newScale = Math.min(scaleX, scaleY, 1)
        setScale(newScale)
      }
    }

    calculateScale()
    window.addEventListener('resize', calculateScale)

    return () => window.removeEventListener('resize', calculateScale)
  }, [])

  const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB in bytes

  const handleFileDrop = file => {
    if (file && file.type.startsWith('image/')) {
      if (file.size > MAX_FILE_SIZE) {
        errorToast('Error', 'Image size must not exceed 20 MB')
        return
      }
      // Update background.value with the blob URL - this persists across route changes
      const blobUrl = URL.createObjectURL(file)
      setField('background', {
        ...background,
        isCustom: true,
        value: blobUrl,
        image: blobUrl,
      })
    }
  }

  const handleDragEnter = e => {
    if (background.isCustom) {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(true)
    }
  }

  const handleDragOver = e => {
    if (background.isCustom) {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(true)
    }
  }

  const handleDragLeave = e => {
    if (background.isCustom) {
      // Only set drag over to false if we're actually leaving the section element
      if (!childRef.current?.contains(e.relatedTarget)) {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)
      }
    }
  }

  const handleDrop = e => {
    if (background.isCustom && !background.value) {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFileDrop(file)
      }
    }
  }

  useEffect(() => {
    const getImageSize = url =>
      new Promise(resolve => {
        const img = new Image()
        img.src = url
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
      })
    if (background.isCustom && background.value) {
      getImageSize(background.value)
        .then(size => {
          const width = Math.max(size.w, 1920)
          const height = (width * 1080) / 1920
          setImageSize({ w: width, h: height })
        })
        .catch(() => {
          setImageSize({ w: 1920, h: 1080 })
        })
    } else {
      setImageSize({ w: 1920, h: 1080 })
    }
  }, [background.isCustom, background.value])

  return (
    <>
      <div
        className={cn('overflow-hidden', className)}
        style={{
          height: `${576 * scale}px`,
        }}
        ref={parentRef}
      >
        <section
          ref={childRef}
          className={cn(
            'relative origin-center rounded-xl border border-neutral-700 bg-contain bg-center bg-no-repeat',
            background.isCustom && !background.value && isDragOver && 'border-[#DC00D4] bg-neutral-800/50',
            background.isCustom && !background.value && 'cursor-pointer',
          )}
          style={{
            width: '1024px',
            minWidth: '1024px',
            minHeight: '576px',
            maxWidth: '1024px',
            maxHeight: '576px',
            transform: `scale(${scale})`,
            backgroundImage,
            transformOrigin: 'top left',
          }}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (background.isCustom && !background.value) {
              imgInputRef.current?.click()
            }
          }}
        >
          <input
            type='file'
            onChange={e => {
              const file = e.target.files[0]
              if (file) {
                handleFileDrop(file)
              }
              // Reset input value to allow selecting the same file again
              e.target.value = ''
            }}
            accept='image/*'
            className='hidden'
            ref={imgInputRef}
          />
          {background.isCustom && !background.value ? (
            <div className='flex size-full items-center justify-center bg-[url("/images/content-studio/empty_pair.png")] bg-auto bg-center bg-no-repeat'>
              <div className='flex flex-col items-center justify-center gap-3'>
                <TextHeading className='font-archia text-center text-3xl font-semibold'>
                  {t.rich('Upload image title', {
                    // eslint-disable-next-line react/no-unstable-nested-components
                    link: chunks => <span className='text-primary-600 cursor-pointer underline'>{chunks}</span>,
                  })}
                </TextHeading>
                <TextSubHeading className='text-center text-neutral-300'>{t('Upload image subtitle')}</TextSubHeading>
              </div>
            </div>
          ) : (
            <>
              <div className='flex h-full items-center justify-center'>{children}</div>
              <div className='absolute bottom-0 left-0 flex w-full items-center justify-between px-10 py-9'>
                <LogoIcon className='h-8 w-auto' />
                <NextImage src='/svgs/thena-fi-link.svg' alt='Image' width={114} height={14} />
              </div>
            </>
          )}
        </section>
      </div>
      <div
        id='share-origin'
        className='fixed top-[100vh] left-[100vh] order-3 hidden origin-top-left bg-cover bg-center bg-no-repeat'
        style={{
          aspectRatio: '1920/1080',
          minWidth: `${imageSize.w}px`,
          minHeight: `${imageSize.h}px`,
          backgroundImage,
        }}
      >
        <div className='flex h-full items-center justify-center'>{children}</div>
        <div className='absolute bottom-0 left-0 flex w-full items-center justify-between px-10 py-9'>
          <LogoIcon className='h-8 w-auto' />
          <NextImage src='/svgs/thena-fi-link.svg' alt='Image' width={114} height={14} />
        </div>
      </div>
    </>
  )
}
