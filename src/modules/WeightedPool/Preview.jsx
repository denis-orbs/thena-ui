import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import SuccessModal from '@/components/modal/SuccessModal'
import { NewTextSubHeading, Paragraph, TextHeading } from '@/components/typography'
import { useTokenColor } from '@/hooks/useTokenColor'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useWeightedPool } from '@/hooks/weightedPool/useWeigtedPool'
import { formatAmount, toWei } from '@/lib/utils'
import { CoinsHandIcon } from '@/svgs'

import PieChart from './PieChart'
import PoolOverviewTable from './PoolOverviewTable'
import GroupIconTokens from '../../components/icongroup/GroupIconTokens'

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

  const windowSize = useWindowSize()
  const isMobile = windowSize.width < 768

  return (
    <div className='space-y-4 lg:space-y-8'>
      <NewTextSubHeading>{t('Overview')}</NewTextSubHeading>

      <Box className='space-y-4 !p-4 max-md:rounded-none md:space-y-8'>
        <div className='flex gap-4'>
          <div className='flex w-full flex-col gap-4 max-md:w-full md:max-w-[264px] md:flex-row'>
            <div className='flex flex-row items-center gap-4 md:flex-col md:gap-2'>
              <GroupIconTokens
                height={tokens?.length > 4 ? (isMobile ? 16 : 24) : 24}
                width={tokens?.length > 4 ? (isMobile ? 16 : 24) : 24}
                tokens={tokens}
              />
              <Paragraph className='hidden w-fit text-xs font-medium md:block lg:text-sm xl:text-base'>
                {t('Weighted Pool')}
              </Paragraph>
              <TextHeading className='flex-wrap font-archia text-xl font-semibold md:hidden'>{poolName}</TextHeading>
            </div>

            <div className='flex flex-row items-center max-md:w-full max-md:justify-between md:flex-col md:gap-2 md:pl-4'>
              <div>
                <TextHeading className='font-archia text-xl font-semibold md:text-2xl lg:text-3xl'>
                  $ {formatAmount((tokens || []).reduce((sum, token) => sum + Number(token.amount) * token.price, 0))}
                </TextHeading>
              </div>
              <div className='flex gap-3'>
                <CoinsHandIcon className='h-5 w-5' />
                <Paragraph className='text-base'>{`Fees ${fees} %`}</Paragraph>
              </div>
            </div>
          </div>

          <div className='hidden md:block'>
            <NewTextSubHeading className='font-archia text-3xl font-semibold md:text-[40px] md:leading-[48px]'>
              {poolName}
            </NewTextSubHeading>
          </div>
        </div>

        <div className='flex flex-col gap-4 md:flex-row'>
          <div className='w-full md:max-w-[264px]'>
            <PieChart tokens={tokens} colors={colors} showTotalPercent={false} />
          </div>
          <div className='w-full'>
            <PoolOverviewTable tokens={tokens} colors={colors} />
          </div>
        </div>
      </Box>

      <div className='flex flex-col gap-2'>
        <EmphasisButton className='hidden w-full max-lg:block' onClick={() => setCurrentStep(2)}>
          {t('Cancel')}
        </EmphasisButton>
        <PrimaryButton disabled={pending} onClick={onCreate} className='w-full'>
          {t('Deposit')}
        </PrimaryButton>
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
