import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import Box from '@/components/box'
import { EmphasisButton, PrimaryButton, TextButton } from '@/components/buttons/Button'
import SuccessModal from '@/components/modal/SuccessModal'
import { Paragraph, TextHeading } from '@/components/typography'
import { useTokenColor } from '@/hooks/useTokenColor'
import { useWeightedPool } from '@/hooks/weightedPool/useWeigtedPool'
import { formatAmount, toWei } from '@/lib/utils'
import { CoinsHandIcon } from '@/svgs'

import PieChart from './PieChart'
import PoolOverviewTable from './PoolOverviewTable'
import WeightedPoolLogo from './WeightedPoolLogo'

export default function Preview({ tokensAndWeights, setCurrentStep, fees, poolName }) {
  const t = useTranslations()
  const { push } = useRouter()

  const [showModalSuccess, setShowModalSuccess] = useState(false)
  const [poolAddress, setPoolAddress] = useState()

  const [colors, setColors] = useState([])
  const { renderBackgroundColors } = useTokenColor()

  const tokens = useMemo(
    () => tokensAndWeights.map(token => ({ ...token.token, weight: token.weight, amount: token.amount })),
    [tokensAndWeights],
  )

  const { onCreateWeightedPool, pending } = useWeightedPool()

  const onCreate = useCallback(() => {
    const allocatesPercent = tokensAndWeights.map(token => token.weight)
    const amountsWei = tokensAndWeights.map(token => toWei(Number(token.amount)))
    const symbol = tokens.map(token => token.symbol).join('/')
    onCreateWeightedPool(poolName, symbol, tokens, allocatesPercent, amountsWei, fees, result => {
      setPoolAddress(result)
      setShowModalSuccess(true)
    })
  }, [fees, onCreateWeightedPool, poolName, tokens, tokensAndWeights])

  useEffect(() => {
    renderBackgroundColors(tokens.map(item => item.logoURI.replace('https://cdn.thena.fi/', '/logo-token/'))).then(
      result => {
        setColors(result)
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens.length, renderBackgroundColors])

  return (
    <div className='space-y-4'>
      <TextHeading className='font-archia text-3xl font-semibold'>{t('Overview')}</TextHeading>
      <Box className='space-y-8'>
        <div className='flex items-center gap-4'>
          <div className='flex flex-[4] gap-4'>
            <div className='space-y-2'>
              <WeightedPoolLogo
                height={tokens?.length === 2 ? 32 : 24}
                width={tokens?.length === 2 ? 32 : 24}
                tokens={tokens}
              />
              <Paragraph className='text-xs'>{t('Weighted Pool')}</Paragraph>
            </div>
            <div className='space-y-2'>
              <div>
                <TextHeading>
                  $ {formatAmount((tokens || []).reduce((sum, token) => sum + Number(token.amount) * token.price, 0))}
                </TextHeading>
              </div>
              <div className='flex gap-3'>
                <CoinsHandIcon className='h-5 w-5' />
                <Paragraph>{`Fees ${fees} %`}</Paragraph>
              </div>
            </div>
          </div>
          <div className='flex-[6]'>
            <TextHeading className='font-archia text-3xl font-semibold lg:text-[40px] lg:leading-[48px]'>
              {poolName}
            </TextHeading>
          </div>
        </div>
        <div className='flex gap-4'>
          <div className='flex-[4]'>
            <PieChart tokens={tokens} colors={colors} showTotalPercent={false} />
          </div>
          <div className='flex-[6]'>
            <PoolOverviewTable tokens={tokens} colors={colors} />
          </div>
        </div>
      </Box>
      <div className='space-y-16'>
        <PrimaryButton disabled={pending} onClick={onCreate} className='w-full'>
          {t('Deposit')}
        </PrimaryButton>
        <div className='flex flex-col gap-4 lg:flex-row'>
          <EmphasisButton className='w-full lg:w-fit' onClick={() => setCurrentStep(prev => prev - 1)}>
            {t('Back')}
          </EmphasisButton>
          <TextButton className='w-full lg:w-fit' onClick={() => push('/pools')}>
            {t('Cancel')}
          </TextButton>
        </div>
      </div>
      <SuccessModal
        isOpen={showModalSuccess && Boolean(poolAddress)}
        onClose={() => setShowModalSuccess(false)}
        heading={t('Deposit Successful')}
        message={t('You have successfully deposited and staked')}
        buttonAction={
          <div className='flex gap-4'>
            <EmphasisButton className='w-1/2' onClick={() => push('/pools')}>
              {t('View Pool')}
            </EmphasisButton>
            <EmphasisButton className='w-1/2' onClick={() => push('/dashboard')}>
              {t('View Dashboard')}
            </EmphasisButton>
          </div>
        }
      />
    </div>
  )
}
