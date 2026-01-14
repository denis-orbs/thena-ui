import SelectorGrid from '@/components/selector/SelectorGrid'
import cn from '@/utils/classes'

function AutomaticStrategy({ strategyAutoData, className, classNames, canSelect = true }) {
  return (
    <SelectorGrid
      className={cn('!flex !flex-col !gap-4', className)}
      classNames={{
        ...classNames,
        item: cn('!h-auto', classNames?.item),
      }}
      data={strategyAutoData}
      canSelect={canSelect}
      isGrid={false}
    />
  )
}

export default AutomaticStrategy
