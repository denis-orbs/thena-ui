import dayjs from 'dayjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import { centerCrop, makeAspectCrop } from 'react-image-crop'

import { errorToast } from '@/lib/notify'
import { canvasPreview } from '@/modules/TradingCompetition/canvasPreview'

import useDebounce from './useDebounce'

export function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
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

export const useCropImage = (aspect, selectedImage) => {
  const [initImage, setInitImage] = useState()
  const [completedCrop, setCompletedCrop] = useState()
  const [crop, setCrop] = useState()

  const previewCanvasRef = useRef(null)
  const imgRef = useRef(null)

  const debounceCompleteCrop = useDebounce(completedCrop, 100)

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

  useEffect(() => {
    if (debounceCompleteCrop?.width && debounceCompleteCrop?.height && imgRef.current && previewCanvasRef.current) {
      canvasPreview(imgRef.current, previewCanvasRef.current, debounceCompleteCrop, 1, 0)
    }
  }, [debounceCompleteCrop])

  return {
    initImage,
    setInitImage,
    completedCrop,
    setCompletedCrop,
    crop,
    setCrop,
    previewCanvasRef,
    imgRef,
    exportCropToNewImage,
  }
}
