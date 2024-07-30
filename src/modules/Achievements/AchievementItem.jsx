import Image from 'next/image'
import React, { useMemo } from 'react'

import './style.css'

import CustomTooltip from '@/components/tooltip'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { formatAmount, formatNumberDecimals } from '@/lib/utils'

function AchievementItem({ item, onClick = () => {}, showTooltip = true }) {
  const percent = useMemo(() => Math.ceil((item.currentQuantity / item.achievement.quantityTarget) * 100), [item])

  return (
    <div className='flex cursor-pointer flex-col items-center gap-3 p-5' onClick={onClick}>
      <Image
        data-tooltip-id={showTooltip ? item.achievement.id : ''}
        src={item.achievement.icon}
        alt=''
        width={72}
        height={80}
        className='size-28'
      />
      <p className='text-center'>
        {item.currentQuantity ? formatAmount(item.currentQuantity, false, 2) : 0}/
        {Number(item.achievement.quantityTarget) >= 1000000
          ? formatAmount(Number(item.achievement.quantityTarget), true)
          : Number(item.achievement.quantityTarget).toLocaleString()}
      </p>
      <div className='h-[3px] w-full max-w-[120px] overflow-hidden rounded-full bg-[#272845]'>
        <div
          className='gradient-bg h-[3px] rounded-full transition-all duration-300 ease-in-out'
          style={{ width: `${percent}%` }}
        />
      </div>
      <TextHeading className='text-center text-xl'>{item.achievement.name}</TextHeading>
      <TextSubHeading className='text-center'>{item.achievement.description}</TextSubHeading>

      {showTooltip && (
        <CustomTooltip
          className='z-50 min-w-[136px] max-w-[320px] text-nowrap !bg-neutral-500 after:!bg-neutral-500'
          id={item.achievement.id}
          place='top'
        >
          {formatNumberDecimals(item.ratioAchieved * 100, 4)}% users completed this achievement.
        </CustomTooltip>
      )}
    </div>
  )
}

export default AchievementItem
