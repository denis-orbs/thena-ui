import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo } from 'react'

import NewListings from '@/app/pools/NewListings'
import { Paragraph } from '@/components/typography'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import InfoIcon from '@/icons/InfoIcon'
import { usePairInfo } from '@/state/pools/hooks'
import { wrappedAddress } from '@/utils/utils'

import PoolCoinsIcon from '~/svgs/pool-coins.svg'

function AvailablePools({ tokens = [], pairType, setFoundedPool = () => {} }) {
  const t = useTranslations()
  const { isLgDown } = useMediaQuery()

  const foundedPair = usePairInfo({
    token0Address: wrappedAddress(tokens[0]),
    token1Address: wrappedAddress(tokens[1]),
    type: pairType,
  })

  const sortOptions = useMemo(() => {
    const options = [
      {
        label: 'Pair',
        value: 'pair',
        width: 'w-[42%] md:w-[35%]',
        isDesc: true,
      },
      {
        label: 'APR',
        value: 'apr',
        width: 'w-[calc(58%-50px)] md:w-[15%]',
        isDesc: true,
      },
    ]

    if (isLgDown) {
      return [
        ...options,
        {
          label: '',
          value: 'action',
          width: 'lg:w-[100px] w-[50px]',
          disabled: true,
          className: 'items-end',
        },
      ]
    }

    return [
      ...options,
      {
        label: 'TVL',
        value: 'tvl',
        width: 'w-[15%]',
        isDesc: true,
      },
      {
        label: 'Fees (24h)',
        value: 'fee',
        width: 'w-[calc(30%-100px)]',
        isDesc: true,
      },
      {
        label: '',
        value: 'action',
        width: 'w-[100px]',
        disabled: true,
      },
    ]
  }, [isLgDown])

  useEffect(() => {
    if (foundedPair) {
      setFoundedPool(foundedPair)
    } else {
      setFoundedPool()
    }
  }, [foundedPair, setFoundedPool])

  return (
    <>
      {foundedPair ? (
        <div className='w-full'>
          <NewListings
            defaultShow
            pools={foundedPair ? [foundedPair] : []}
            title={
              <div className='flex gap-2'>
                <PoolCoinsIcon className='h-6 w-6 stroke-neutral-400' />
                {t('Available Pools')}
              </div>
            }
            classNames={{
              title: 'flex flex-row justify-normal gap-2',
              divider: 'block',
              header: 'border-none border-transparent flex',
              cellItem: 'p-2 lg:p-2',
              cellItemLabel: 'hidden',
              tableContainer: 'flex flex-col gap-2 lg:gap-4',
              rowItem: 'border-none',
            }}
            sortOptions={sortOptions}
            size='small'
            tableBasic={isLgDown}
          />
        </div>
      ) : (
        <>
          <div className='border-primary-800 bg-primary-950 flex gap-4 rounded-xl border p-4 px-5 md:p-6 lg:p-8'>
            <div className='flex'>
              <InfoIcon className='stroke-primary-600! size-5 md:size-8' />
            </div>
            <div className='flex flex-col gap-2'>
              <Paragraph className='text-xl font-medium text-neutral-100 lg:text-xl'>
                {t('No [type] pool available for the selected tokens', {
                  type: pairType,
                })}
              </Paragraph>
              <Paragraph className='text-primary-100 text-base leading-5'>
                {t('You can begin to create a new pool below')}
              </Paragraph>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default AvailablePools
