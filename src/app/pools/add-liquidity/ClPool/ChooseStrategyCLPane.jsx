import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import Box from '@/components/box'
import { PrimaryButton } from '@/components/buttons/Button'
import { TextIconButton } from '@/components/buttons/IconButton'
import ChooseStrategy from '@/components/common/AddLiquidity/ChooseStrategy'
import { TextHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { useGetAsset } from '@/hooks/fusion/Tokens'
import { cn } from '@/lib/utils'
import { useV3MintState } from '@/state/fusion/hooks'
import { ArrowLeftIcon } from '@/svgs'

export function ChooseStrategyCLPane({ pool, goPreviousStep, goNextStep, isAdd, showSidebar }) {
  const t = useTranslations()
  const { strategy } = useV3MintState()
  const [isReverse, setIsReverse] = useState(true)

  const searchParams = useSearchParams()
  const firstAddress = searchParams.get('firstAddress') || pool?.token0?.address
  const secondAddress = searchParams.get('secondAddress') || pool?.token1?.address

  // this component used in pool/[address]/page and pools/add-liquidity
  // in pools/add-liquidity -> have searchParams -> show step back
  // in pool/[address]/page -> no searchParams   -> hide step back
  const isShowBackBtn = searchParams.get('firstAddress')

  const firstAsset = useGetAsset(firstAddress)
  const secondAsset = useGetAsset(secondAddress)

  return (
    <>
      <Box className={cn('y-3 w-full flex-[6] lg:py-6', showSidebar ? '' : 'w-full')}>
        <div className='mb-4 flex w-full items-center justify-between'>
          <TextHeading className='font-archia text-3xl text-neutral-50'>
            <TextIconButton className={cn(!isShowBackBtn && 'hidden')} Icon={ArrowLeftIcon} onClick={goPreviousStep} />
            {t('Choose Strategy')}
          </TextHeading>
        </div>

        <ChooseStrategy
          pairType={PAIR_TYPES.LSD}
          firstAsset={firstAsset}
          secondAsset={secondAsset}
          isReverse={isReverse}
          setIsReverse={setIsReverse}
          isAdd={isAdd}
        />

        <div className={cn('mt-auto inline-flex w-full flex-col pt-5')}>
          <PrimaryButton
            disabled={!strategy && strategy?.isAutomatic}
            className={strategy || !strategy?.isAutomatic ? 'bg-primary-600 hover:bg-primary-700' : ''}
            onClick={goNextStep}
          >
            {t('Continue')}
          </PrimaryButton>
        </div>
      </Box>

      {showSidebar && (
        <div className='flex-[4]'>
          <Box className='flex flex-col gap-4'>
            <TextHeading className='font-archia text-2xl font-semibold'>{t('New Deposit')}</TextHeading>
            <>
              {isAdd ? (
                <div className='flex flex-col gap-6'>
                  <p>{t('New Deposit description')}</p>
                  {isAdd && <p>{t('You can also choose to stake your liquidity')}</p>}
                </div>
              ) : (
                <>
                  <div className='flex flex-col gap-6'>
                    <p>{t('This pool requires maintenance')}</p>
                    <p>
                      <strong>{t('Automatic Strategy title')}: </strong>
                      <span>{t('Automatic Strategy description')}</span>
                    </p>
                    <p>
                      <strong>{t('Manual Strategy title')}: </strong>
                      <span>{t('Manual Strategy description')}</span>
                    </p>
                  </div>
                </>
              )}
            </>
          </Box>
        </div>
      )}
    </>
  )
}
