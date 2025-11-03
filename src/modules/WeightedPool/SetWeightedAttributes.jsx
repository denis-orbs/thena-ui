import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import React, { useCallback, useMemo, useState } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { NewTextSubHeading, TextHeading, TextSubHeading } from '@/components/typography'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useWindowSize } from '@/hooks/useWindowSize'
import InfoIcon from '@/icons/InfoIcon'
import { formatAmount, isInvalidAmount } from '@/lib/utils'

import PoolSummary from './PoolSummary'
import SetInitialLiquidity from './SetInitialLiquidity'
import SetPoolFees from './SetPoolFees'
import GroupIconTokens from '../../components/icongroup/GroupIconTokens'

function SetWeightedAttributes({ tokensAndWeights, fees, setFees, setTokenAndWeights, poolName, setCurrentStep }) {
  const router = useRouter()
  const t = useTranslations()
  const { isLgDown } = useMediaQuery()

  const isDisable = useMemo(
    () => (tokensAndWeights || []).some(item => item.isError || isInvalidAmount(item?.amount)),
    [tokensAndWeights],
  )

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
      <div className='flex flex-col justify-between gap-4 md:gap-8 xl:flex-row'>
        <div className='flex flex-7 flex-col gap-4 lg:gap-[14px] xl:min-h-full'>
          <TextHeading className='font-archia text-xl font-semibold md:text-2xl lg:text-3xl'>
            {t('Weighted Pool')}
          </TextHeading>
          <div className='flex gap-4'>
            <GroupIconTokens
              tokens={tokensAndWeights.map(token => ({ ...token.token, weight: token.weight }))}
              width={tokensAndWeights.length > 4 ? (isMobile ? 16 : 40) : 40}
              height={tokensAndWeights.length > 4 ? (isMobile ? 16 : 40) : 40}
            />
            <TextHeading className='lg:font-archia text-base text-wrap text-neutral-200 md:text-2xl lg:text-3xl lg:font-semibold'>
              {poolName}
            </TextHeading>
          </div>
        </div>
        <div className='min-h-full flex-3'>
          <SetPoolFees fees={fees} setFees={setFees} />
        </div>
        {isLgDown && (
          <PoolSummary
            fees={fees}
            tokens={tokensAndWeights.map(token => ({ ...token.token, weight: token.weight, amount: token.amount }))}
            isMobile
          />
        )}
      </div>
      <div className='flex flex-col gap-2 md:gap-4'>
        <div className='flex flex-col-reverse gap-4'>
          <NewTextSubHeading>{t('Set Initial Liquidity')}</NewTextSubHeading>
          {tokensAndWeights.length > 0 && totalValueInUsd < 20000 ? (
            <div className='border-warn-900 bg-warn-950 flex flex-1 gap-4 rounded-lg border px-4 py-5 lg:flex-2 lg:items-center lg:p-8'>
              <InfoIcon className='stroke-warn-600! size-5 min-h-5 min-w-5 lg:size-8 lg:min-w-8' />
              <div className='flex flex-col gap-1'>
                <TextHeading className='text-rose text-xl'>{t('Initial funds')}</TextHeading>
                <TextSubHeading className='text-rose text-base'>
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
      <div className='mt-8 flex flex-col gap-2 md:mt-4'>
        <EmphasisButton className='hidden w-full max-lg:block' onClick={() => router.push('/pools')}>
          {t('Cancel')}
        </EmphasisButton>
        <PrimaryButton className='w-full' onClick={handleNextStep}>
          {t('Next')}
        </PrimaryButton>
      </div>
    </div>
  )
}
export default SetWeightedAttributes
