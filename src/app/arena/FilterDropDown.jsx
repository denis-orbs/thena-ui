import { useTranslations } from 'next-intl'

import { EmphasisButton } from '@/components/buttons/Button'
import Dropdown from '@/components/dropdown'
import Popover from '@/components/popover'
import Tabs from '@/components/tabs'
import Toggle from '@/components/toggle'
import { SizeTypes } from '@/constant/type'

export const FILTERS = {
  Default: 'Default',
  totalPrize: 'Prize Pool',
  participantCount: 'Attendees',
  entryFee: 'Entry Fee',
}

function FilterDropDown({ filter, setFilter }) {
  const t = useTranslations()

  return (
    <div>
      <Popover triggerElement={<EmphasisButton>{t('Filter')}</EmphasisButton>}>
        <p className='font-figtree text-xl font-semibold leading-6 text-white'>{t('Filters')}</p>
        <div className='my-2 rounded-lg bg-neutral-900 p-1'>
          <Tabs
            data={[
              {
                label: t('All'),
                active: filter.market === 'all' || filter.market === null,
                onClickHandler: () => {
                  setFilter({
                    ...filter,
                    market: 'all',
                  })
                },
              },
              {
                label: t('Spot'),
                active: filter.market === 'spot',
                onClickHandler: () => {
                  setFilter({
                    ...filter,
                    market: 'spot',
                  })
                },
              },
              {
                label: t('Perpetual'),
                active: filter.market === 'perpetual',
                onClickHandler: () => {
                  setFilter({
                    ...filter,
                    market: 'perpetual',
                  })
                },
                disabled: true,
              },
            ]}
            size={SizeTypes.Small}
            itemClassName='text-sm uppercase'
          />
        </div>
        <div className='my-2 flex items-center space-x-2.5'>
          <span className='whitespace-nowrap text-white'>{t('Sort By')}</span>
          <Dropdown
            className='w-full lg:w-[200px]'
            data={Object.values(FILTERS).map(item => ({
              label: item,
            }))}
            selected={filter.sortBy}
            setSelected={ele => setFilter({ ...filter, sortBy: ele.label })}
          />
        </div>
        <Toggle
          className='my-2 lg:flex'
          checked={filter.free}
          onChange={() => setFilter({ ...filter, free: !filter.free })}
          toggleId='free-join'
          label={t('Free To Join')}
        />
      </Popover>
    </div>
  )
}

export default FilterDropDown
