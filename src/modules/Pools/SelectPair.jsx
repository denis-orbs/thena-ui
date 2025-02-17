import { useTranslations } from 'next-intl'
import React, { useMemo, useRef, useState } from 'react'

import Selection from '@/components/selection'
import { TextHeading } from '@/components/typography'
import { InfoCircleWhite } from '@/svgs'

import SelectToken from './SelectToken'

function SelectPair({ updateSearchParams, firstAsset, secondAsset }) {
  const t = useTranslations()
  const [isAutomatic, setIsAutomatic] = useState(true)
  const wrapperSelectRef = useRef(null)
  const strategyType = useMemo(
    () => [
      {
        label: t('Manual'),
        active: !isAutomatic,
        onClickHandler: () => {
          setIsAutomatic(false)
        },
      },
      {
        label: t('Automated'),
        active: isAutomatic,
        onClickHandler: () => {
          setIsAutomatic(true)
        },
      },
    ],
    [isAutomatic, t],
  )

  return (
    <>
      <div className='flex flex-row items-center justify-between'>
        <div className='flex flex-row items-center justify-between gap-2'>
          <TextHeading className='font-archia text-3xl font-semibold text-neutral-50'>
            {t('Automated Strategies')}
          </TextHeading>
          <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-700'>
            <InfoCircleWhite className='h-5 w-5 stroke-neutral-400' />
          </div>
        </div>
        <Selection data={strategyType} isTranslation={false} />
      </div>
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2' ref={wrapperSelectRef}>
        <SelectToken
          otherAsset={secondAsset}
          setOtherAsset={item => {
            updateSearchParams({ firstAddress: item?.address })
          }}
          setSelectedAsset={item => {
            updateSearchParams({ firstAddress: item?.address })
          }}
          placeHolder={t('Select Token')}
          selectedAsset={firstAsset}
          dropdownAlign='left'
          optionWidth={wrapperSelectRef?.current?.getBoundingClientRect()?.width}
        />
        <SelectToken
          otherAsset={firstAsset}
          setOtherAsset={item => {
            updateSearchParams({ firstAddress: item?.address })
          }}
          setSelectedAsset={item => {
            updateSearchParams({ secondAddress: item?.address })
          }}
          placeHolder={t('Select Token')}
          selectedAsset={secondAsset}
          dropdownAlign='right'
          optionWidth={wrapperSelectRef?.current?.getBoundingClientRect()?.width}
        />
      </div>
    </>
  )
}

export default SelectPair
