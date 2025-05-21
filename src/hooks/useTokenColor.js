import { useCallback } from 'react'

export const useTokenColor = () => {
  const getColorFromImage = useCallback(
    imageUrl =>
      new Promise(resolve => {
        const img = document.createElement('img')
        img.crossOrigin = 'anonymous'
        img.src = imageUrl
        img.style.position = 'absolute'
        img.style.left = '-9999px'
        img.style.top = '0'
        document.body.appendChild(img)

        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')

          ctx.drawImage(img, 0, 0, img.width, img.height)

          const centerX = Math.floor(img.width / 2)
          const centerY = 15
          const pixel = ctx.getImageData(centerX, centerY, 1, 1).data
          const rgbColor = `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3] / 255})`

          if (pixel[3] === 0) {
            resolve('rgba(255, 255, 255, 1)')
          } else {
            resolve(rgbColor)
          }

          document.body.removeChild(img)
        }

        img.onerror = () => {
          resolve('transparent')
          document.body.removeChild(img)
        }
      }),
    [],
  )

  const renderBackgroundColors = useCallback(
    imageUrls => Promise.all(imageUrls.map(url => getColorFromImage(url))),
    [getColorFromImage],
  )

  return { renderBackgroundColors }
}
