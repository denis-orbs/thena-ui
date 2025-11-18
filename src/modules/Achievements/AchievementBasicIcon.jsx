import './style.css'

import NextImage from '@/components/image/NextImage'
import CustomTooltip from '@/components/tooltip'
import cn from '@/utils/classes'

function AchievementBasicIcon({ item, showTooltip = true, className, classNames }) {
  return (
    <div className={cn('flex cursor-pointer flex-col items-center gap-3 p-5', className)}>
      {/* <Image
        data-tooltip-id={showTooltip ? item.achievement.id : ''}
        src={item.achievement.icon}
        alt=''
        width={72}
        height={48}
        className='size-28'
      /> */}
      <div className={cn('flex h-[80px] w-[72px] items-center justify-center overflow-hidden', classNames?.item)}>
        <NextImage
          data-tooltip-id={showTooltip ? item.achievement.id : ''}
          src={item.achievement.icon}
          alt=''
          className='object-cover'
        />
      </div>
      {showTooltip && (
        <CustomTooltip
          className='z-50 bg-neutral-500! text-nowrap after:bg-neutral-500!'
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
