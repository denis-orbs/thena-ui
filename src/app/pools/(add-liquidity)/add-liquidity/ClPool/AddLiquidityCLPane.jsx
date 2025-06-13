import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import FusionAdd from '@/components/common/AddLiquidity/FusionAdd'
import KyberZapperPane from '@/components/common/AddLiquidity/FusionAdd/KyberZapperPane'
import ManualAdd from '@/components/common/AddLiquidity/FusionAdd/ManualAdd'
import ManualPositionInfo from '@/components/common/AddLiquidity/FusionAdd/ManualPositionInfo'
import SuccessModal from '@/components/modal/SuccessModal'
import Selection from '@/components/selection'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Bound } from '@/state/fusion/actions'
import { useV3MintState } from '@/state/fusion/hooks'
import { ZapperIcon } from '@/svgs'

export default function AddLiquidityCLPane({
  mintInfo,
  currentPrice,
  baseCurrency,
  quoteCurrency,
  setBaseCurrency,
  setQuoteCurrency,
  position,
  handleBack,
}) {
  const { strategy } = useV3MintState()
  const t = useTranslations()
  const { push } = useRouter()

  const [isZapper, setIsZapper] = useState(false)
  const [showModalSuccess, setShowModalSuccess] = useState(false)

  const { isXlDown } = useMediaQuery()

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

  const { ticksAtLimit } = position || {}

  const isFullRange = useMemo(
    () => (ticksAtLimit ? ticksAtLimit[Bound.LOWER] && ticksAtLimit[Bound.UPPER] : false),
    [ticksAtLimit],
  )

  if (!strategy) return <div />

  return (
    <div className='mt-4 flex w-full flex-col gap-6 lg:flex-row lg:gap-8'>
      <div className='w-full flex-6 flex-col bg-transparent'>
        {strategy?.isAutomatic ? (
          <FusionAdd
            strategy={strategy}
            onShowModalSuccess={onShowModalSuccess}
            handleBack={handleBack}
            isSmall={!isXlDown}
          />
        ) : (
          <div className='flex flex-col gap-2'>
            {!mintInfo?.noLiquidity && !position && (
              <Selection
                className='w-full items-stretch md:h-11'
                classNames={{
                  items: 'md:text-sm text-xs',
                }}
                data={addSelections}
                isFull
                isTranslation={false}
              />
            )}

            {position && (
              <ManualPositionInfo
                baseCurrency={baseCurrency}
                quoteCurrency={quoteCurrency}
                position={position}
                isFullRange={isFullRange}
              />
            )}

            {isZapper ? (
              <KyberZapperPane
                baseCurrency={baseCurrency}
                quoteCurrency={quoteCurrency}
                mintInfo={mintInfo}
                currentPrice={currentPrice}
                strategy={strategy}
                onShowModalSuccess={onShowModalSuccess}
                handleBack={handleBack}
              />
            ) : (
              <ManualAdd
                baseCurrency={baseCurrency}
                quoteCurrency={quoteCurrency}
                setBaseCurrency={setBaseCurrency}
                setQuoteCurrency={setQuoteCurrency}
                mintInfo={mintInfo}
                currentPrice={currentPrice}
                strategy={strategy}
                onShowModalSuccess={onShowModalSuccess}
                position={position}
                handleBack={handleBack}
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
