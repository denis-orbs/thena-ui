import React, { useEffect, useMemo, useRef, useState } from 'react'

import Input from '@/components/input'
import Selection from '@/components/selection'
import { Paragraph } from '@/components/typography'
import { SettingsIcon } from '@/svgs'

const slippageTolerance = [0.1, 0.5, 1]
function SettingSlippageDropDown({ slippage, updateSlippage }) {
  const [show, setShow] = useState(false)
  const dropdownRef = useRef(null)

  const selections = useMemo(
    () =>
      slippageTolerance.map(ele => ({
        label: ele,
        active: slippage === Number(ele),
        onClickHandler: () => {
          updateSlippage(Number(ele))
        },
      })),
    [slippage, updateSlippage],
  )

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShow(false)
      }
    }

    if (show) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [show])

  return (
    <div className='mb-4 flex flex-col gap-3' ref={dropdownRef}>
      <p className='flex items-center justify-end gap-1'>
        <Paragraph>Slippage</Paragraph>
        <SettingsIcon
          className='h-6 w-6 cursor-pointer'
          onClick={() => {
            setShow(prev => !prev)
          }}
        />
      </p>
      {show && (
        <div className='right-0 top-full z-10 flex w-fit gap-3 rounded-lg shadow-lg'>
          <Selection data={selections} className='bg-transparent' />
          <Input
            classNames={{
              input: 'w-[110px]',
            }}
            val={slippage}
            onChange={e => updateSlippage(Number(e.target.value) || 0)}
            suffix='%'
          />
        </div>
      )}
    </div>
  )
}

export default SettingSlippageDropDown
