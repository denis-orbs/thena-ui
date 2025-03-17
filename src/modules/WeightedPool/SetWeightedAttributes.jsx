import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { useWindowSize } from '@/hooks/useWindowSize'
import { formatAmount, isInvalidAmount } from '@/lib/utils'
import { InfoIcon } from '@/svgs'

import PoolSummary from './PoolSummary'
import SetInitialLiquidity from './SetInitialLiquidity'
import SetPoolFees from './SetPoolFees'
import GroupIconTokens from '../../components/icongroup/GroupIconTokens'

function SetWeightedAttributes({ tokensAndWeights, fees, setFees, setTokenAndWeights, poolName, setCurrentStep }) {
  const isDisable = useMemo(
    () => (tokensAndWeights || []).some(item => item.isError || isInvalidAmount(item?.amount)),
    [tokensAndWeights],
  )
  const t = useTranslations()

  const [checkError, setCheckError] = useState(false)
  const handleNextStep = useCallback(() => {
    setCheckError(true)
    if (isDisable) {
      return
    }

    setCurrentStep(3)
  }, [isDisable, setCurrentStep])

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

  const maxDeposit = useMemo(() => {
    const max = tokensAndWeights.reduce((sum, curr) => {
      const { balance, price } = curr.token
      if (balance) {
        return sum + Number(balance || 0) * price
      }
      return sum
    }, 0)
    return max
  }, [tokensAndWeights])

  const windowSize = useWindowSize()
  const isMobile = windowSize.width < 768

  return (
    <div className='flex h-full flex-col gap-4 lg:relative'>
      <div className='flex flex-col gap-4 xl:flex-row 2xl:gap-8'>
        <div className='flex flex-[7] flex-col gap-4 lg:gap-[14px] xl:min-h-full'>
          <TextHeading className='font-archia text-xl font-semibold md:text-2xl lg:text-3xl'>
            {t('Weighted Pool')}
          </TextHeading>
          <div className='flex gap-4'>
            <GroupIconTokens
              tokens={tokensAndWeights.map(token => ({ ...token.token, weight: token.weight }))}
              width={tokensAndWeights.length > 4 ? (isMobile ? 16 : 40) : 40}
              height={tokensAndWeights.length > 4 ? (isMobile ? 16 : 40) : 40}
            />
            <TextHeading className='text-wrap text-base text-neutral-200 md:text-2xl lg:font-archia lg:text-3xl lg:font-semibold'>
              {poolName}
            </TextHeading>
          </div>
        </div>
        <div className='min-h-full flex-[3]'>
          <SetPoolFees fees={fees} setFees={setFees} />
        </div>
        <PoolSummary
          fees={fees}
          tokens={tokensAndWeights.map(token => ({ ...token.token, weight: token.weight, amount: token.amount }))}
          isMobile
        />
      </div>
      <div className='space-y-4'>
        <div className='flex flex-col-reverse gap-4'>
          <TextHeading className='flex-2 text-lg md:text-xl lg:flex-1 lg:font-archia lg:text-3xl lg:font-semibold'>
            {t('Set Initial Liquidity')}
          </TextHeading>
          {tokensAndWeights.length > 0 && totalValueInUsd < 20000 ? (
            <div className='flex flex-1 gap-4 rounded-lg border border-warn-900 bg-warn-950 px-4 py-5 lg:flex-2 lg:items-center'>
              <InfoIcon className='h-5 min-h-5 w-5 min-w-5 !stroke-warn-600 lg:h-8 lg:w-8' />
              <div className='flex flex-col gap-1'>
                <TextHeading className='text-xl text-rose'>{t('Initial funds')}</TextHeading>
                <TextSubHeading className='text-base text-rose'>
                  {t('We recommend you to provide new pools [maxDeposit]', {
                    maxDeposit: formatAmount(maxDeposit),
                  })}
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
      <div className='flex flex-col gap-2 lg:absolute lg:-bottom-[92px] lg:flex-row lg:gap-4'>
        <EmphasisButton className='w-full lg:w-fit' onClick={() => setCurrentStep(1)}>
          {t('Back')}
        </EmphasisButton>
        <PrimaryButton className='w-full lg:w-fit' onClick={handleNextStep}>
          {t('Next')}
        </PrimaryButton>
      </div>
    </div>
  )
}
export default SetWeightedAttributes
