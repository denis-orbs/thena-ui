import Image from 'next/image'
import React, { useMemo } from 'react'

import './style.css'

import CustomTooltip from '@/components/tooltip'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { formatAmount, formatNumberDecimals } from '@/lib/utils'

function NotAchievementItem({ achievement, onClick = () => {}, showTooltip = true }) {
  const [formatedCurrentQuantity, formatedQuantityTarget, percentage] = useMemo(
    () => [
      Number(achievement.currentQuantity) >= 1000000
        ? formatAmount(Number(achievement.currentQuantity), true)
        : Number(achievement.currentQuantity).toLocaleString(),
      Number(achievement.quantityTarget) >= 1000000
        ? formatAmount(Number(achievement.quantityTarget), true)
        : Number(achievement.quantityTarget).toLocaleString(),
      Math.ceil((achievement.currentQuantity * 100) / achievement.quantityTarget),
    ],
    [achievement],
  )

  return (
    <div className='flex cursor-pointer flex-col items-center gap-3 p-5' onClick={onClick}>
      <Image
        data-tooltip-id={showTooltip ? achievement.id : ''}
        src={achievement.icon}
        alt=''
        width={72}
        height={80}
        className='size-28'
      />
      <p className='text-center'>
        {formatedCurrentQuantity}/{formatedQuantityTarget}
      </p>
      <div className='h-[3px] w-full max-w-[120px] overflow-hidden rounded-full bg-[#272845]'>
        <div
          className='gradient-bg h-[3px] rounded-full transition-all duration-300 ease-in-out'
          style={{ width: `${percentage}%` }}
        />
      </div>
      <TextHeading className='text-center text-xl'>{achievement.name}</TextHeading>
      <TextSubHeading className='text-center'>{achievement.description}</TextSubHeading>

      {showTooltip && (
        <CustomTooltip
          className='z-50 max-w-[320px] min-w-[136px] bg-neutral-500! text-nowrap after:bg-neutral-500!'
          id={achievement.id}
          place='top'
        >
          {formatNumberDecimals((achievement.ratioAchieved ?? 0) * 100, 4)}% users completed this achievement.
        </CustomTooltip>
      )}
    </div>
  )
}

export default NotAchievementItem
