import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import CustomTooltip from '@/components/tooltip'
import { cn } from '@/lib/utils'
import { DiamondIcon, StarLineSmallIcon } from '@/svgs'

import { RewardType } from '../../constant'

export function RewardIconTooltip({ className = '', iconSize = 5, rewardType, id }) {
  const t = useTranslations()
  const { icon, description } = useMemo(() => {
    if (rewardType === RewardType.Point) {
      return {
        icon: (
          <StarLineSmallIcon
            className={cn('inline-block cursor-pointer', `h-${iconSize} w-${iconSize}`)}
            data-tooltip-id={id}
          />
        ),
        description: t('Reward Star Description'),
      }
    }
    return {
      icon: (
        <DiamondIcon
          className={cn('inline-block cursor-pointer', `h-${iconSize} w-${iconSize}`)}
          data-tooltip-id={id}
        />
      ),
      description: t('Reward Diamond Description'),
    }
  }, [rewardType, id, t, iconSize])
  return (
    <div className={cn(className, `h-${iconSize} w-${iconSize}`)}>
      {icon}
      <CustomTooltip className='z-9999 max-w-[250px]' id={id}>
        <span className='text-sm leading-5 font-normal'>{description}</span>
      </CustomTooltip>
    </div>
  )
}
