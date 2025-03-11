import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Input from '@/components/input'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { isInvalidAmount } from '@/lib/utils'
import { InfoIcon } from '@/svgs'

import PoolSummary from './PoolSummary'
import SetInitialLiquidity from './SetInitialLiquidity'
import SetPoolFees from './SetPoolFees'
import GroupIconTokens from '../../components/icongroup/GroupIconTokens'

function SetWeightedAttributes({
  tokensAndWeights,
  fees,
  setFees,
  poolName,
  setPoolName,
  setTokenAndWeights,
  setCurrentStep,
}) {
  const isDisable = useMemo(
    () => (tokensAndWeights || []).some(item => item.isError || isInvalidAmount(item?.amount)),
    [tokensAndWeights],
  )
  const defaultName = useMemo(() => tokensAndWeights.map(token => token.token.symbol).join('/'), [tokensAndWeights])
  const t = useTranslations()

  const [checkError, setCheckError] = useState(false)
  const handleNextStep = useCallback(() => {
    setCheckError(true)
    if (isDisable) {
      return
    }

    if (poolName === '') setPoolName(defaultName)
    setCurrentStep(prev => prev + 1)
  }, [defaultName, isDisable, poolName, setCurrentStep, setPoolName])

  useEffect(() => {
    if (poolName === '') setPoolName(defaultName)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalValueInUsd = useMemo(
    () =>
      tokensAndWeights.reduce((sum, curr) => {
        const { token, amount } = curr
        if (token) {
          return sum + Number(amount || 0) * token.price
        }
        return sum
      }, 0),
    [tokensAndWeights],
  )

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-4 lg:flex-row'>
        <div className='flex min-h-full flex-[7] flex-col justify-between gap-4'>
          <TextHeading className='font-archia text-xl font-semibold sm:text-2xl lg:text-3xl'>
            {t('Set Pool Name')}
          </TextHeading>
          <div className='flex items-center gap-4'>
            <GroupIconTokens
              tokens={tokensAndWeights.map(token => ({ ...token.token, weight: token.weight }))}
              width={tokensAndWeights.length <= 4 ? 32 : 24}
              height={tokensAndWeights.length <= 4 ? 32 : 24}
            />
            <Paragraph className='text-neutral-200'>{t('Weighted Pool')}</Paragraph>
          </div>
          <Input
            type='text'
            val={poolName}
            onChange={e => setPoolName(e.target.value)}
            onFocus={e => e.target.select()}
            placeholder='Enter Name for Pool'
            className='h-11'
            classNames={{ input: 'h-11' }}
          />
        </div>
        <div className='min-h-full flex-[3]'>
          <SetPoolFees fees={fees} setFees={setFees} />
        </div>
        <PoolSummary
          fees={fees}
          tokens={tokensAndWeights.map(token => ({ ...token.token, weight: token.weight }))}
          isMobile
        />
      </div>
      <div className='space-y-4 md:space-y-8 lg:space-y-16'>
        <div className='space-y-4'>
          <div className='flex flex-col-reverse gap-4'>
            <TextHeading className='flex-2 text-lg md:text-xl lg:flex-1 lg:font-archia lg:text-3xl lg:font-semibold'>
              {t('Set Initial Liquidity')}
            </TextHeading>
            {tokensAndWeights.length > 0 && totalValueInUsd < 20000 ? (
              <div className='flex flex-1 items-center gap-4 rounded-lg border border-warn-900 bg-warn-950 px-4 py-5 lg:flex-2'>
                <InfoIcon className='h-5 min-h-5 w-5 min-w-5 !stroke-warn-600 lg:h-8 lg:w-8' />
                <div className='flex flex-col gap-1'>
                  <TextHeading className='text-xl text-rose'>{t('Initial funds')}</TextHeading>
                  <TextSubHeading className='text-base text-rose'>
                    {t('We recommend you to provide new pools')}
                  </TextSubHeading>
                </div>
              </div>
            ) : (
              <></>
            )}
          </div>
          <SetInitialLiquidity
            checkError={checkError}
            setTokenAndWeights={setTokenAndWeights}
            tokensAndWeights={tokensAndWeights}
          />
        </div>
        <div className='flex flex-col gap-4 lg:flex-row'>
          <EmphasisButton className='w-full lg:w-fit' onClick={() => setCurrentStep(prev => prev - 1)}>
            {t('Back')}
          </EmphasisButton>
          <PrimaryButton className='w-full lg:w-fit' onClick={handleNextStep}>
            {t('Next')}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
export default SetWeightedAttributes
