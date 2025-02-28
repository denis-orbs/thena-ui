import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import FusionAdd from '@/components/common/AddLiquidity/FusionAdd'
import KyberZapperPane from '@/components/common/AddLiquidity/FusionAdd/KyberZapperPane'
import ManualAdd from '@/components/common/AddLiquidity/FusionAdd/ManualAdd'
import CircleImage from '@/components/image/CircleImage'
import SuccessModal from '@/components/modal/SuccessModal'
import Selection from '@/components/selection'
import { Paragraph, TextHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import { cn, formatAmount } from '@/lib/utils'
import { useV3MintState } from '@/state/fusion/hooks'
import { CoinUSDIcon, ZapperIcon } from '@/svgs'

export default function AddLiquidityCLPane({ mintInfo, baseCurrency, quoteCurrency, position }) {
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

  if (!strategy) return <div />

  return (
    <div className='flex w-full flex-col gap-6 lg:flex-row lg:gap-8'>
      <div className='w-full flex-[6] flex-col bg-transparent'>
        {strategy?.isAutomatic ? (
          <FusionAdd strategy={strategy} onShowModalSuccess={onShowModalSuccess} />
        ) : (
          <div className='space-y-4'>
            {!mintInfo?.noLiquidity && !position && (
              <Selection className={cn('w-full')} data={addSelections} isFull isTranslation={false} />
            )}

            {position && (
              <div className='mt-8'>
                <article
                  className={cn(
                    'gird-cols-6 grid items-center gap-4 rounded-lg bg-neutral-900 p-4 font-medium md:grid-cols-3',
                  )}
                >
                  <div className='flex w-full flex-col gap-1'>
                    <div className='flex items-center justify-center gap-2 lg:justify-start'>
                      <div className='size-16 min-w-16'>
                        <CoinUSDIcon className='size-full' />
                      </div>
                      <div className='flex min-w-36 flex-col gap-2 md:min-w-0'>
                        <Paragraph className='text-base text-primary-100 xl:text-xl'>
                          ${position.depositInUSD}
                        </Paragraph>
                        <Paragraph className='text-sm text-primary-100 xl:text-base'>
                          {t('Deposit Value in USD')}
                        </Paragraph>
                      </div>
                    </div>
                  </div>

                  <div className='flex w-full flex-col gap-1'>
                    <div className='flex items-center justify-center gap-2 lg:justify-start'>
                      <CircleImage className='size-16' src={baseCurrency.logoURI ?? UNKNOWN_LOGO} alt='base token' />
                      <div className='flex min-w-36 flex-col gap-2 md:min-w-0'>
                        <Paragraph className='text-base text-primary-100 xl:text-xl'>
                          ${formatAmount(position.amountAsset0)}
                        </Paragraph>
                        <Paragraph className='text-sm text-primary-100 xl:text-base'>
                          {t('[symbol] deposit', { symbol: baseCurrency.symbol })}
                        </Paragraph>
                      </div>
                    </div>
                  </div>

                  <div className='flex w-full flex-col gap-1'>
                    <div className='flex items-center justify-center gap-2 lg:justify-start'>
                      <CircleImage className='size-16' src={quoteCurrency.logoURI ?? UNKNOWN_LOGO} alt='base token' />
                      <div className='flex min-w-36 flex-col gap-2 md:min-w-0'>
                        <Paragraph className='text-base text-primary-100 xl:text-xl'>
                          ${formatAmount(position.amountAsset1)}
                        </Paragraph>
                        <Paragraph className='text-sm text-primary-100 xl:text-base'>
                          {t('[symbol] deposit', { symbol: quoteCurrency.symbol })}
                        </Paragraph>
                      </div>
                    </div>
                  </div>
                </article>

                <div className='mt-8 flex flex-col gap-2 lg:flex-row'>
                  <div className='flex w-full flex-col gap-2'>
                    <Paragraph className='text-xs text-neutral-500'>
                      {t('Min [symbolA] per [symbolB] price', {
                        symbolA: baseCurrency.symbol,
                        symbolB: quoteCurrency.symbol,
                      })}
                    </Paragraph>
                    <div
                      className={cn('flex flex-col rounded-xl border border-neutral-700 px-4 py-3 text-neutral-400')}
                    >
                      <TextHeading>{position.minPrice}</TextHeading>
                    </div>
                  </div>

                  <div className='flex w-full flex-col gap-2'>
                    <Paragraph className='text-xs text-neutral-500'>
                      {t('Max [symbolA] per [symbolB] price', {
                        symbolA: baseCurrency.symbol,
                        symbolB: quoteCurrency.symbol,
                      })}
                    </Paragraph>
                    <div
                      className={cn('flex flex-col rounded-xl border border-neutral-700 px-4 py-3 text-neutral-400')}
                    >
                      <TextHeading>{position.maxPrice}</TextHeading>
                    </div>
                  </div>
                </div>
              </div>
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
                position={position}
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
