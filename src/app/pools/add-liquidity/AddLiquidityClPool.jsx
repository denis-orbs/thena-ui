import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import Box from '@/components/box'
import { TextIconButton } from '@/components/buttons/IconButton'
import ChooseStrategy from '@/components/common/AddLiquidity/ChooseStrategy'
import { TextHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { cn } from '@/lib/utils'
import { useCustomTokens } from '@/state/tokenCustom/store'
import { ArrowLeftIcon } from '@/svgs'

function AddLiquidityClPool({
  pool,
  setCurrentStep,
  isAutomatic,
  setIsAutomatic,
  strategy,
  setStrategy,
  isAdd,
  showSidebar = true,
}) {
  const t = useTranslations()
  const assets = useAssets()
  const { customTokens } = useCustomTokens()
  const [isReverse, setIsReverse] = useState(true)
  return (
    <>
      <Box className={cn('w-full flex-[6] flex-col py-3 lg:py-6', !showSidebar ? 'w-full' : '')}>
        <div className='mb-4 h-11 w-fit'>
          {showSidebar ? (
            <TextHeading className='font-archia text-3xl text-neutral-50'>
              <TextIconButton Icon={ArrowLeftIcon} onClick={() => setCurrentStep(0)} />
              {t('Choose Strategy')}
            </TextHeading>
          ) : (
            <TextHeading className='font-archia text-3xl text-neutral-50'>
              {t(pool?.type === PAIR_TYPES.LSD ? 'Choose Strategy' : 'New Deposit')}
            </TextHeading>
          )}
        </div>
        {pool.type === PAIR_TYPES.LSD && (
          <ChooseStrategy
            pool={pool}
            pairType={PAIR_TYPES.LSD}
            firstAsset={[...assets, ...customTokens].find(
              asset => asset.address.toLowerCase() === pool?.token0?.address?.toLowerCase(),
            )}
            secondAsset={[...assets, ...customTokens].find(
              asset => asset.address.toLowerCase() === pool?.token1?.address?.toLowerCase(),
            )}
            strategy={strategy}
            setStrategy={setStrategy}
            setCurrentStep={setCurrentStep}
            isAutomatic={isAutomatic}
            setIsAutomatic={setIsAutomatic}
            isReverse={isReverse}
            setIsReverse={setIsReverse}
            isAdd={isAdd}
          />
        )}
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

export default AddLiquidityClPool
