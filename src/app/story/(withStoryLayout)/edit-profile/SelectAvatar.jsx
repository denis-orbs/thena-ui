import Image from 'next/image'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useCallback, useState } from 'react'

import { cn } from '@/lib/utils'

import { ModalEditUserAvatar } from './ModalEditUserAvatar'

export function SelectAvatar({ avatarUrl, setAvatarUrl }) {
  const [isHovered, setIsHovered] = useState(false)
  const [openModal, setOpenModal] = useState(false)

  const onChangeAvatar = useCallback(
    url => {
      setAvatarUrl(url)
    },
    [setAvatarUrl],
  )
  return (
    <div>
      <div
        className='relative inline-block cursor-pointer '
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setOpenModal(true)}
      >
        <Image
          src={avatarUrl ?? Avatar}
          alt='Preview'
          width={124}
          height={124}
          className=' h-[124px] w-[124px] rounded-full object-cover'
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
      </div>
      {openModal && (
        <ModalEditUserAvatar isOpen={openModal} onChange={onChangeAvatar} closeModal={() => setOpenModal(false)} />
      )}
    </div>
  )
}

export default SelectAvatar
