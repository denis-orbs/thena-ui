import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useState } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import FusionAdd from '@/components/common/AddLiquidity/FusionAdd'
import ManualAddPanel from '@/components/common/AddLiquidity/ManualAddPanel'
import SuccessModal from '@/components/modal/SuccessModal'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useV3MintState } from '@/state/fusion/hooks'

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

  const [showModalSuccess, setShowModalSuccess] = useState(false)

  const { isXlDown } = useMediaQuery()

  const onShowModalSuccess = useCallback(() => {
    setShowModalSuccess(true)
  }, [setShowModalSuccess])

  if (!strategy) return <div />

  return (
    <div className='flex w-full flex-col gap-6 lg:flex-row lg:gap-8'>
      <div className='w-full flex-6 flex-col bg-transparent'>
        {strategy?.isAutomatic ? (
          <FusionAdd
            strategy={strategy}
            onShowModalSuccess={onShowModalSuccess}
            handleBack={handleBack}
            isSmall={!isXlDown}
          />
        ) : (
          <ManualAddPanel
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
