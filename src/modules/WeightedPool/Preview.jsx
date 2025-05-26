import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'

import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import SuccessModal from '@/components/modal/SuccessModal'
import { NewTextSubHeading, Paragraph, TextHeading } from '@/components/typography'
import { THENACOLORS } from '@/constant'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useWeightedPool } from '@/hooks/weightedPool/useWeigtedPool'
import { formatAmount, toWei, wrappedAddress } from '@/lib/utils'
import { CoinsHandIcon } from '@/svgs'

import PieChart from './PieChart'
import PoolOverviewTable from './PoolOverviewTable'
import GroupIconTokens from '../../components/icongroup/GroupIconTokens'

export default function Preview({ tokensAndWeights, setCurrentStep, fees, poolName }) {
  const t = useTranslations()
  const { push } = useRouter()

  const [showModalSuccess, setShowModalSuccess] = useState(false)
  const [poolAddress, setPoolAddress] = useState()

  const tokens = useMemo(
    () => tokensAndWeights.map(token => ({ ...token.token, weight: token.weight, amount: token.amount })),
    [tokensAndWeights],
  )

  const { onCreateWeightedPool, pending } = useWeightedPool()

  const onCreate = useCallback(() => {
    const sortedTokens = tokens.sort((a, b) => wrappedAddress(a).localeCompare(wrappedAddress(b)))
    const allocatesPercent = sortedTokens.map(token => token.weight)
    const amountsWei = sortedTokens.map(token => toWei(Number(token.amount)))
    const symbol = tokens.map(token => token.symbol).join('/')
    onCreateWeightedPool(poolName, symbol, sortedTokens, allocatesPercent, amountsWei, fees, result => {
      setPoolAddress(result)
      setShowModalSuccess(true)
    })
  }, [fees, onCreateWeightedPool, poolName, tokens])

  const windowSize = useWindowSize()
  const isMobile = windowSize.width < 768

  return (
    <div className='max-xl:space-y-4'>
      <NewTextSubHeading className='xl:hidden'>{t('Overview')}</NewTextSubHeading>

      <Box className='w-full space-y-4 p-4 max-xl:rounded-none xl:px-[42px] xl:py-8'>
        <NewTextSubHeading className='!text-4xl text-neutral-500 max-xl:hidden'>{t('Overview')}</NewTextSubHeading>
        <div className='flex gap-4'>
          <div className='flex w-full flex-col gap-4 max-xl:w-full xl:flex-row'>
            <div className='flex flex-row gap-4 xl:gap-2'>
              <GroupIconTokens
                height={tokens?.length > 4 ? (isMobile ? 16 : 32) : 32}
                width={tokens?.length > 4 ? (isMobile ? 16 : 32) : 32}
                tokens={tokens}
              />
              <TextHeading className='flex-wrap font-archia text-xl font-semibold xl:text-3xl'>{poolName}</TextHeading>
            </div>
          </div>
        </div>

        <div className='flex flex-col items-center gap-4 xl:flex-row xl:gap-12'>
          <div className='flex flex-row items-center max-xl:w-full max-xl:justify-between xl:min-w-[203px] xl:flex-col xl:gap-8 xl:pl-4'>
            <div className='flex flex-row justify-between gap-4 max-xl:w-full xl:flex-col xl:items-center'>
              <TextHeading className='text-lg font-medium max-xl:hidden'>{t('Weighted Pool')}</TextHeading>
              <TextHeading className='font-archia text-xl font-semibold leading-6 xl:text-3xl'>
                $ {formatAmount((tokens || []).reduce((sum, token) => sum + Number(token.amount) * token.price, 0))}
              </TextHeading>
              <div className='flex gap-3'>
                <CoinsHandIcon className='h-5 w-5' />
                <Paragraph className='!text-base !leading-5'>{`Fees ${fees} %`}</Paragraph>
              </div>
            </div>
            <PrimaryButton disabled={pending} onClick={onCreate} className='w-full max-xl:hidden'>
              {t('Deposit')}
            </PrimaryButton>
          </div>
          <div className='order-3 w-full xl:order-2'>
            <PoolOverviewTable tokens={tokens} colors={THENACOLORS} />
          </div>
          <div className='order-2 w-full xl:order-3 xl:max-w-[264px]'>
            <PieChart tokens={tokens} showTotalPercent={false} />
          </div>
        </div>
      </Box>

      <div className='flex flex-col gap-2 xl:hidden'>
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
