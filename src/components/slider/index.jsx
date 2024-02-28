import Slider from 'rc-slider'
import React, { useMemo } from 'react'

import 'rc-slider/assets/index.css'

import Tabs from '../tabs'
import { TextHeading } from '../typography'

function CustomSlider({ percent, onPercentChange }) {
  const percents = useMemo(
    () => [
      {
        label: '10%',
        onClickHandler: () => onPercentChange(10),
      },
      {
        label: '25%',
        onClickHandler: () => onPercentChange(25),
      },
      {
        label: '50%',
        onClickHandler: () => onPercentChange(50),
      },
      {
        label: 'Max',
        onClickHandler: () => onPercentChange(100),
      },
    ],
    [onPercentChange],
  )
  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center justify-between'>
        <p className='font-medium text-white'>Amount</p>
        <Tabs data={percents} />
      </div>
      <div className='flex flex-col gap-3 self-stretch rounded-xl border border-neutral-700 p-4'>
        <TextHeading>{percent}%</TextHeading>
        <Slider min={0} max={100} value={percent} defaultValue={0} onChange={val => onPercentChange(val)} />
      </div>
    </div>
  )
}

export default CustomSlider
