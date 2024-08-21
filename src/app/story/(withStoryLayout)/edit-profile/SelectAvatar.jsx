import Image from 'next/image'
import React, { useCallback, useState } from 'react'

import { cn } from '@/lib/utils'
import { CloseIcon } from '@/svgs'

export function SelectAvatar({ defaultAvatarURL, setSelectedImage, previewUrl, setPreviewUrl }) {
  const handleImageChange = event => {
    const file = event.target.files[0]
    if (file) {
      setSelectedImage(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const [isHovered, setIsHovered] = useState(false)
  const handleResetDefault = useCallback(
    e => {
      e.stopPropagation()
      e.preventDefault()

      setSelectedImage(null)
      setPreviewUrl(defaultAvatarURL)
    },
    [defaultAvatarURL, setSelectedImage, setPreviewUrl],
  )

  return (
    <>
      <div
        className='relative w-min cursor-pointer'
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <input type='file' accept='image/*' onChange={handleImageChange} style={{ display: 'none' }} id='fileInput' />
        <label htmlFor='fileInput' className='relative inline-block cursor-pointer'>
          <Image
            src={previewUrl ?? '/images/apollo.png'}
            alt='Preview'
            width={124}
            height={124}
            className=' rounded-full object-cover'
          />
          <div
            className={cn(
              'absolute left-0 top-0 flex h-full w-full items-center justify-center rounded-full bg-[]',
              isHovered ? 'opacity-1' : 'opacity-0',
            )}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
            }}
          >
            Upload
          </div>
        </label>
        {isHovered && (
          <div onClick={handleResetDefault}>
            <CloseIcon className='CloseIcon absolute right-0 top-0 h-6 w-6' />
          </div>
        )}
      </div>
    </>
  )
}

export default SelectAvatar
