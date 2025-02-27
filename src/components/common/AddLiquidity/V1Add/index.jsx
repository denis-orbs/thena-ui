'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import SuccessModal from '@/components/modal/SuccessModal'
import Selection from '@/components/selection'
import { cn } from '@/lib/utils'
import { ZapperIcon } from '@/svgs'

import { ManualPaneV1 } from './ManualPaneV1'
import { CommonZapperPane } from '../components/CommonZapperPane'

export default function V1Add({ pool, pairType, firstAsset, secondAsset, setFirstAddress, setSecondAddress }) {
  const [isZapper, setIsZapper] = useState(false)
  const [showModalSuccess, setShowModalSuccess] = useState(false)
  const { push } = useRouter()
  const t = useTranslations()

  const addSelections = useMemo(
    () => [
      {
        label: t('Pool Token Deposit'),
        active: !isZapper,
        onClickHandler: () => {
          setIsZapper(false)
        },
      },
      {
        label: (
          <div className='flex items-center justify-center gap-1'>
            <ZapperIcon className='size-5' />
            <span>{t('Zapper Deposit')}</span>
          </div>
        ),
        active: isZapper,
        onClickHandler: () => {
          setIsZapper(true)
        },
      },
    ],
    [isZapper, t],
  )

  return (
    <div className={cn('inline-flex w-full flex-col gap-4')}>
      {Boolean(pool) && <Selection data={addSelections} isFull isTranslation={false} />}
      {isZapper ? (
        <CommonZapperPane
          asset0={firstAsset}
          asset1={secondAsset}
          strategy={pool}
          onShowModalSuccess={() => setShowModalSuccess(true)}
        />
      ) : (
        <ManualPaneV1
          strategy={pool}
          pairType={pairType}
          firstAsset={firstAsset}
          secondAsset={secondAsset}
          setFirstAddress={setFirstAddress}
          setSecondAddress={setSecondAddress}
        />
      )}
      <SuccessModal
        isOpen={showModalSuccess}
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
