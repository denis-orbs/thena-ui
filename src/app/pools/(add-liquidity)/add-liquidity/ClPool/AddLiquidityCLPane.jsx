import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import FusionAdd from '@/components/common/AddLiquidity/FusionAdd'
import ManualAdd from '@/components/common/AddLiquidity/FusionAdd/ManualAdd'
import KyberZapperPane from '@/components/common/AddLiquidity/FusionAdd/ZapperPane'
import SuccessModal from '@/components/modal/SuccessModal'
import Selection from '@/components/selection'
import { cn } from '@/lib/utils'
import SettingSlippageDropDown from '@/modules/Position/SettingSlippageDropDown'
import { useV3MintState } from '@/state/fusion/hooks'

export default function AddLiquidityCLPane({ mintInfo, baseCurrency, quoteCurrency }) {
  const { strategy } = useV3MintState()
  const t = useTranslations()
  const { push } = useRouter()

  const [isZapper, setIsZapper] = useState(false)
  const [slippage, setSlippage] = useState(0.5)
  const [showModalSuccess, setShowModalSuccess] = useState(false)

  const addSelections = useMemo(
    () => [
      {
        label: 'Pool Token Deposit',
        active: !isZapper,
        onClickHandler: () => {
          setIsZapper(false)
        },
      },
      {
        label: 'Single Token Deposit',
        active: isZapper,
        onClickHandler: () => {
          setIsZapper(true)
        },
      },
    ],
    [isZapper],
  )

  const onShowModalSuccess = useCallback(() => {
    setShowModalSuccess(true)
  }, [setShowModalSuccess])

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
            <SettingSlippageDropDown slippage={slippage} updateSlippage={setSlippage} />

            {isZapper ? (
              <KyberZapperPane
                baseCurrency={baseCurrency}
                quoteCurrency={quoteCurrency}
                slippage={slippage}
                mintInfo={mintInfo}
                strategy={strategy}
                onShowModalSuccess={onShowModalSuccess}
              />
            ) : (
              <ManualAdd
                baseCurrency={baseCurrency}
                quoteCurrency={quoteCurrency}
                mintInfo={mintInfo}
                slippage={slippage}
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
