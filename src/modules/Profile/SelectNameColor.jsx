import React, { useCallback } from 'react'

import { cn } from '@/lib/utils'

const LIST_COLOR = [
  {
    value: 'ffffff',
    color: 'name-color-1',
    bg: 'bg-color-1',
  },
  {
    value: 'dc00d4',
    color: 'name-color-2',
    bg: 'bg-color-2',
  },
  {
    value: 'f5df00',
    color: 'name-color-3',
    bg: 'bg-color-3',
  },
  {
    value: 'f51c00',
    color: 'name-color-4',
    bg: 'bg-color-4',
  },
  {
    value: '00d1ed',
    color: 'name-color-5',
    bg: 'bg-color-5',
  },
]

export function SelectNameColor({ dataUpdate, setDataUpdate }) {
  const onSelectNameColor = useCallback(
    color => {
      setDataUpdate({
        ...dataUpdate,
        nameColor: color,
      })
    },
    [dataUpdate, setDataUpdate],
  )

  return (
    // eslint-disable-next-line prettier/prettier
    <div className='flex flex-2 gap-2 py-2 lg:max-w-4xl'>
      {LIST_COLOR.map(({ color, bg, value }) => (
        <div className='flex cursor-pointer items-center gap-4 p-2' onClick={() => onSelectNameColor(color)}>
          <div className={cn('rounded-full p-1', dataUpdate.nameColor === color ? `border border-[#${value}]` : '')}>
            <div className={cn('h-8 w-8 rounded-full', bg)} />
          </div>
        </div>
      ))}
    </div>
  )
}
