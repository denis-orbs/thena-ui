import Image from 'next/image'

import './style.css'

import CustomTooltip from '@/components/tooltip'
import { cn } from '@/lib/utils'

function AchievementBasicIcon({ item, showTooltip = true, className }) {
  return (
    <div className={cn('flex cursor-pointer flex-col items-center gap-3 p-5', className)}>
      <Image
        data-tooltip-id={showTooltip ? item.achievement.id : ''}
        src={item.achievement.icon}
        alt=''
        width={72}
        height={80}
        className='size-28'
      />
      {showTooltip && (
        <CustomTooltip
          className='z-50 text-nowrap !bg-neutral-500 after:!bg-neutral-500'
          id={item.achievement.id}
          place='top'
        >
          {item.achievement.description ?? ''}
        </CustomTooltip>
      )}
    </div>
  )
}

export default AchievementBasicIcon
