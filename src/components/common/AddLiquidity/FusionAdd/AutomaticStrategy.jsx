import SelectorGrid from '@/components/selector/SelectorGrid'

function AutomaticStrategy({ strategyAutoData, className, classNames, canSelect = true, isGrid = true }) {
  return (
    <SelectorGrid
      className={className}
      classNames={classNames}
      data={strategyAutoData}
      canSelect={canSelect}
      isGrid={isGrid}
    />
  )
}

export default AutomaticStrategy
