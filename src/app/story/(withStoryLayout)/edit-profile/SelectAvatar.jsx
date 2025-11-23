import Image from 'next/image'
import React, { useState } from 'react'

import cn from '@/utils/classes'

import { ModalEditUserAvatar } from './ModalEditUserAvatar'

export function SelectAvatar({ avatarUrl }) {
  const [isHovered, setIsHovered] = useState(false)
  const [openModal, setOpenModal] = useState(false)

  return (
    <div>
      <div
        className='relative inline-block cursor-pointer'
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setOpenModal(true)}
      >
        <Image
          src={avatarUrl ?? '/images/home/stats/socials/social-1.png'}
          alt='Preview'
          width={124}
          height={124}
          className='h-[124px] w-[124px] rounded-full object-cover'
        />
        <div
          className={cn(
            'bg-[] absolute top-0 left-0 flex h-full w-full items-center justify-center rounded-full',
            isHovered ? 'opacity-1' : 'opacity-0',
          )}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
          }}
        >
          Upload
        </div>
      </div>
      {openModal && <ModalEditUserAvatar isOpen={openModal} closeModal={() => setOpenModal(false)} />}
    </div>
  )
}

export default SelectAvatar
