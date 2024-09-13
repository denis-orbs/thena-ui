import React, { useCallback } from 'react'

export const LIST_COLOR = [
  {
    value: '#ffffff',
  },
  {
    value: '#dc00d4',
  },
  {
    value: '#f5df00',
  },
  {
    value: '#f51c00',
  },
  {
    value: '#00d1ed',
  },
]

export function SelectNameColor({ dataUpdate, setDataUpdate }) {
  const onSelectNameColor = useCallback(
    value => {
      setDataUpdate({
        ...dataUpdate,
        nameColor: value,
      })
    },
    [dataUpdate, setDataUpdate],
  )

  return (
    <div className='flex gap-2 py-2 lg:w-[300px]'>
      {LIST_COLOR.map(({ value }) => (
        <div key={value} className='flex cursor-pointer items-center gap-6' onClick={() => onSelectNameColor(value)}>
          <div
            className='rounded-full p-1'
            style={
              dataUpdate.nameColor === value
                ? {
                    borderWidth: '1px',
                    borderColor: value,
                  }
                : {}
            }
          >
            <div
              className='h-8 w-8 rounded-full'
              style={{
                backgroundColor: value,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
