import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import FusionAdd from '@/components/common/AddLiquidity/FusionAdd'
import KyberZapperPane from '@/components/common/AddLiquidity/FusionAdd/KyberZapperPane'
import ManualAdd from '@/components/common/AddLiquidity/FusionAdd/ManualAdd'
import SuccessModal from '@/components/modal/SuccessModal'
import Selection from '@/components/selection'
import { cn } from '@/lib/utils'
import { useV3MintState } from '@/state/fusion/hooks'
import { ZapperIcon } from '@/svgs'

export default function AddLiquidityCLPane({ mintInfo, baseCurrency, quoteCurrency }) {
  const { strategy } = useV3MintState()
  const t = useTranslations()
  const { push } = useRouter()

  const [isZapper, setIsZapper] = useState(false)
  const [showModalSuccess, setShowModalSuccess] = useState(false)

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

  const onShowModalSuccess = useCallback(() => {
    setShowModalSuccess(true)
  }, [setShowModalSuccess])

  useEffect(() => {
    if (!strategy?.isFarming) {
      setIsZapper(false)
    }
  }, [strategy?.isFarming])

  if (!strategy) return <div />

  return (
    <div className='flex w-full flex-col gap-6 lg:flex-row lg:gap-8'>
      <div className='w-full flex-[6] flex-col bg-transparent'>
        {strategy?.isAutomatic ? (
          <FusionAdd strategy={strategy} onShowModalSuccess={onShowModalSuccess} />
        ) : (
          <div className='space-y-4'>
            {!mintInfo?.noLiquidity && (
              <Selection className={cn('w-full')} data={addSelections} isFull isTranslation={false} />
            )}

            {isZapper ? (
              <KyberZapperPane
                baseCurrency={baseCurrency}
                quoteCurrency={quoteCurrency}
                mintInfo={mintInfo}
                strategy={strategy}
                onShowModalSuccess={onShowModalSuccess}
              />
            ) : (
              <ManualAdd
                baseCurrency={baseCurrency}
                quoteCurrency={quoteCurrency}
                mintInfo={mintInfo}
                strategy={strategy}
                onShowModalSuccess={onShowModalSuccess}
              />
            )}
          </div>
        )}
      </div>

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
