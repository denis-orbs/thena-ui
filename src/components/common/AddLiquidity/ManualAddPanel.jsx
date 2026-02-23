import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import { zeroAddress } from 'viem'

import SlippageContent from '@/app/pools/(add-liquidity)/add-liquidity/SlippageContent'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import NextImage from '@/components/image/NextImage'
import Selection from '@/components/selection'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import cn from '@/utils/classes'

import SettingsIcon from '~/svgs/settings.svg'

import KyberZapperIncreasePane from './FusionAdd/KyberZapperIncreasePane'
import KyberZapperPane from './FusionAdd/KyberZapperPane'
import ManualAdd from './FusionAdd/ManualAdd'

export default function ManualAddPanel({
  baseCurrency,
  quoteCurrency,
  setBaseCurrency,
  setQuoteCurrency,
  mintInfo,
  currentPrice,
  strategy,
  onShowModalSuccess,
  position,
  handleBack,
  pair,
}) {
  const t = useTranslations()
  const [show, setShow] = useState(false)
  const [isZapper, setIsZapper] = useState(false)
  const [slippage, setSlippage] = useState(0.5)
  const { isLgDown } = useMediaQuery()

  // check if the position is farming and the gauge is alive
  const isDisabledDeposit = useMemo(() => {
    if (!position || !pair) return false
    const pos = position?._position
    const isFarmingPos = pos?.deployer === zeroAddress
    if (!isFarmingPos) return false
    if (pair.subpools.find(sub => sub.title === 'CL_Farming' && sub.gauge?.isAlive)) {
      return false
    }
    return true
  }, [position, pair])

  useEffect(() => {
    if (!strategy?.isFarming) {
      setIsZapper(false)
    }
  }, [strategy?.isFarming])

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
            <NextImage src='/svgs/zapper.svg' alt='zapper icon' className='size-4' />
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
    <div className='flex flex-col'>
      <>
        <div className={cn('flex flex-row justify-between gap-2')}>
          <Selection
            className='h-8 w-full flex-1 items-stretch lg:h-11'
            classNames={{
              items: 'md:text-sm text-xs',
            }}
            data={addSelections}
            isFull
            isTranslation={false}
            isSmall={isLgDown}
          />
          <EmphasisIconButton
            className='size-8 lg:size-11'
            classNames='size-4 stroke-neutral-400'
            Icon={SettingsIcon}
            onClick={() => setShow(prev => !prev)}
            disabled={false}
          />
        </div>
        <SlippageContent setSlippage={setSlippage} slippage={slippage} show={show} marginTop={4} />
      </>
      {isZapper ? (
        <>
          {position && position?._position?.tokenId ? (
            <KyberZapperIncreasePane
              position={position}
              onShowModalSuccess={onShowModalSuccess}
              slippage={slippage}
              classNames={{
                input: 'bg-neutral-950 hover:bg-neutral-900 gap-1! max-xl:py-4!',
              }}
              isDisabledDeposit={isDisabledDeposit}
            />
          ) : (
            <KyberZapperPane
              baseCurrency={baseCurrency}
              quoteCurrency={quoteCurrency}
              mintInfo={mintInfo}
              currentPrice={currentPrice}
              strategy={strategy}
              onShowModalSuccess={onShowModalSuccess}
              handleBack={handleBack}
              slippage={slippage}
              classNames={{
                input: 'bg-neutral-950 hover:bg-neutral-900 gap-1! max-xl:py-4!',
              }}
              isDisabledDeposit={isDisabledDeposit}
            />
          )}
        </>
      ) : (
        <div className='mt-2'>
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
            slippage={slippage}
            className={cn(position && 'grid grid-cols-1! gap-2!')}
            classNames={{
              input: 'bg-neutral-950 hover:bg-neutral-900 gap-1! max-xl:py-4!',
            }}
            isDisabledDeposit={isDisabledDeposit}
          />
        </div>
      )}
    </div>
  )
}
