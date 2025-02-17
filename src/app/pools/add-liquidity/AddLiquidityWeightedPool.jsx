import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { Paragraph, TextHeading } from '@/components/typography'
import ChoosePoolTokens from '@/modules/WeightedPool/ChoosePoolTokens'
import { tokensSelected } from '@/state/weightedPool/action'

function AddLiquidityWeightedPool({ setCurrentStep }) {
  const t = useTranslations()
  const dispatch = useDispatch()

  const { push } = useRouter()

  const { tokens: tokensPool } = useSelector(state => state.weightedPool || [])

  const updateTokensSelected = useCallback(
    tokens => {
      dispatch(tokensSelected({ tokens }))
    },
    [dispatch],
  )

  return (
    <div className='space-y-16'>
      <div className='flex flex-col gap-4 lg:flex-row'>
        <div className='flex flex-[6]'>
          <ChoosePoolTokens setTokensSelect={updateTokensSelected} />
        </div>
        <div className='flex flex-[4]'>
          <Box className='flex flex-col gap-2'>
            <TextHeading className='font-archia text-xl font-semibold'>{t('Weighted Pool')}</TextHeading>
            <Paragraph>{t('Weighted pool description')}</Paragraph>
          </Box>
        </div>
      </div>
      <div className='flex flex-col gap-4 lg:flex-row'>
        <EmphasisButton onClick={() => setCurrentStep(prev => prev - 1)} className='w-full lg:w-fit'>
          {t('Back')}
        </EmphasisButton>
        <PrimaryButton
          disabled={(tokensPool || []).length < 2}
          className='w-full lg:w-fit'
          onClick={() => push('/pools/weighted-pool/create')}
        >
          {t('Create New Pool')}
        </PrimaryButton>
      </div>
    </div>
  )
}

export default AddLiquidityWeightedPool
