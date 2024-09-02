'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

import Box from '@/components/box'
import { LockIcon } from '@/svgs'

const LIST_THEME = [
  {
    src: '/images/background.png',
  },
  {
    src: '/images/bg-demo-2.png',
  },
  {
    src: '/images/bg-demo-3.png',
  },
  {
    src: '/images/home/scenes/bg.png',
  },
]
export function SelectTheme({ dataUpdate, setDataUpdate, isAdmin = false }) {
  const [themeChecked, setThemeChecked] = useState(dataUpdate.theme ?? LIST_THEME[0].src)

  useEffect(
    () =>
      setDataUpdate({
        ...dataUpdate,
        theme: themeChecked,
      }),

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [themeChecked],
  )

  return (
    <>
      {LIST_THEME.map((theme, index) => (
        <Box
          key={theme.src}
          className='relative flex h-20 w-36 items-center justify-between space-x-2 border border-primary-800 p-2 pl-3 lg:h-24 lg:w-40 lg:p-2 lg:pl-3 xl:h-28 xl:w-48'
          onClick={() => {
            if (index <= 1 || isAdmin) {
              setThemeChecked(theme.src)
            }
          }}
        >
          {index > 1 && !isAdmin ? (
            <LockIcon className='z-5 absolute right-3 top-3 h-4 w-4' />
          ) : (
            <input
              name='theme-radio'
              type='radio'
              className='z-5 absolute right-3 top-3 rounded-full border border-neutral-500 bg-transparent p-0 focus:border-neutral-500'
              checked={themeChecked === theme.src}
              onChange={() => {
                setThemeChecked(theme.src)
              }}
              disabled={index > 1}
            />
          )}
          <Image
            src={theme.src}
            className='absolute left-[-8px] h-full w-full space-x-0'
            width={100}
            height={100}
            alt='theme.src'
          />
        </Box>
      ))}
    </>
  )
}
