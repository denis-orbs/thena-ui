import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { TextIconButton } from '@/components/buttons/IconButton'
import FusionAdd from '@/components/common/AddLiquidity/FusionAdd'
import ManualAdd from '@/components/common/AddLiquidity/FusionAdd/ManualAdd'
import KyberZapperPane from '@/components/common/AddLiquidity/FusionAdd/ZapperPane'
import IconGroup from '@/components/icongroup'
import Selection from '@/components/selection'
import { TextHeading } from '@/components/typography'
import { useFusionPairs } from '@/context/fusionsContext'
import { useCurrency } from '@/hooks/fusion/Tokens'
import { cn } from '@/lib/utils'
import SettingSlippageModal from '@/modules/Position/SettingSlippageModal'
import { Bound } from '@/state/fusion/actions'
import { useV3DerivedMintInfo, useV3MintState } from '@/state/fusion/hooks'
import { ArrowLeftIcon, CheckCircleIcon, DownloadSuccessIcon, RightInIcon, RightOutIcon } from '@/svgs'

const feeAmount = 3000
export default function AddLiquidityCLPane({ pool, isAdd, isReverse, goPreviousStep, showSidebar = true }) {
  const t = useTranslations()
  const { strategy } = useV3MintState()

  const [isZapper, setIsZapper] = useState(false)
  const [slippage, setSlippage] = useState(0.5)

  const searchParams = useSearchParams()
  const firstAddress = searchParams.get('firstAddress') || pool?.token0?.address
  const secondAddress = searchParams.get('secondAddress') || pool?.token1?.address

  const fusionPairs = useFusionPairs()

  const currencyA = useCurrency(firstAddress)
  const currencyB = useCurrency(secondAddress)
  const baseCurrency = useMemo(() => (isReverse ? currencyB : currencyA), [isReverse, currencyA, currencyB])
  const quoteCurrency = useMemo(() => (isReverse ? currencyA : currencyB), [isReverse, currencyA, currencyB])
  const mintInfo = useV3DerivedMintInfo(baseCurrency, quoteCurrency, feeAmount, baseCurrency, undefined)

  const currentPrice = useMemo(() => {
    if (!mintInfo.price) return

    const _price = mintInfo.invertPrice
      ? parseFloat(mintInfo.price.invert().toSignificant(5))
      : parseFloat(mintInfo.price.toSignificant(5))

    if (Number(_price) <= 0.0001) {
      return '< 0.0001'
    }
    return _price
  }, [mintInfo.price, mintInfo.invertPrice])

  const pair = useMemo(() => {
    if (!pool) return
    const result = (fusionPairs ?? []).find(ele => pool?.address?.toLowerCase() === ele?.address)
    return {
      ...pool,
      currentTick: Number(result?.globalState.tick || 0),
    }
  }, [pool, fusionPairs])
  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = useMemo(() => mintInfo.ticks, [mintInfo])

  const addSelections = useMemo(
    () => [
      {
        label: 'Default',
        active: !isZapper,
        onClickHandler: () => {
          setIsZapper(false)
        },
      },
      {
        label: 'Zapper',
        active: isZapper,
        onClickHandler: () => {
          setIsZapper(true)
        },
      },
    ],
    [isZapper],
  )

  return (
    <div className='flex w-full flex-col gap-6 lg:flex-row lg:gap-8'>
      <Box className={cn('w-full flex-[6] flex-col', showSidebar ? '' : 'w-full')}>
        <div className='mb-3 inline-flex h-11 w-fit items-center'>
          <TextIconButton
            className='font-archia text-3xl text-neutral-50'
            Icon={ArrowLeftIcon}
            onClick={goPreviousStep}
          />
          <h3>{t(mintInfo?.invalidPool ? 'Add Liquidity' : 'New Deposit')}</h3>
        </div>

        <div className='mb-6 flex flex-row justify-between rounded-lg bg-neutral-800 p-4'>
          <div className='flex items-center gap-2'>
            <IconGroup
              className='-space-x-3'
              classNames={{
                image: 'outline-[2.6px] w-7 h-7',
              }}
              logo1={isReverse ? quoteCurrency?.logoURI : baseCurrency?.logoURI}
              logo2={isReverse ? baseCurrency?.logoURI : quoteCurrency?.logoURI}
            />
            <TextHeading>{pool?.symbol}</TextHeading>
          </div>
          <NeutralBadge>{strategy?.title?.replace('_', ' ')}</NeutralBadge>
        </div>

        <div className={cn('flex justify-end', strategy?.isAutomatic && 'hidden')}>
          <SettingSlippageModal slippage={slippage} updateSlippage={setSlippage} />
        </div>

        {strategy?.isAutomatic ? (
          <FusionAdd strategy={isAdd ? pair : strategy} isAdd={isAdd} />
        ) : (
          <div className='space-y-6'>
            <Selection className='w-full' data={addSelections} isFull isTranslation={false} />
            {isZapper ? (
              <KyberZapperPane
                baseCurrency={baseCurrency}
                quoteCurrency={quoteCurrency}
                slippage={slippage}
                mintInfo={mintInfo}
                strategy={strategy}
              />
            ) : (
              <ManualAdd
                baseCurrency={baseCurrency}
                quoteCurrency={quoteCurrency}
                mintInfo={mintInfo}
                slippage={slippage}
                strategy={strategy}
              />
            )}
          </div>
        )}
      </Box>

      <div className={cn('flex-[4]', !showSidebar && 'hidden')}>
        <Box className='flex flex-col gap-4'>
          <TextHeading className='font-archia text-2xl font-semibold'>{t('New Deposit')}</TextHeading>
          <p>{t('New Deposit description')}</p>
          <div className='flex flex-col gap-6'>
            <div className='flex flex-row items-center gap-2'>
              <CheckCircleIcon className='h-5 w-5 stroke-success-600' />
              <div className='flex flex-col'>
                <div className='flex flex-row gap-1'>
                  <span>{t('Pool price tick at', { value: currentPrice })}</span>
                </div>
              </div>
            </div>
            <div className='flex flex-row items-center gap-2'>
              <RightOutIcon className='h-5 w-5 stroke-success-600' />
              <div className='flex flex-col'>
                <div className='flex flex-row gap-1'>
                  <span>{t('Low tick at', { value: tickLower })}</span>
                </div>
              </div>
            </div>
            <div className='flex flex-row items-center gap-2'>
              <RightInIcon className='h-5 w-5 stroke-success-600' />
              <div className='flex flex-col'>
                <div className='flex flex-row gap-1'>
                  <span>{t('High tick at', { value: tickUpper })}</span>
                </div>
              </div>
            </div>
            <div className='flex flex-row items-center gap-2'>
              <DownloadSuccessIcon className='h-5 w-5 stroke-success-600' />
              <div className='flex flex-col'>
                <div className='flex flex-row gap-1'>
                  <span>{t('Quote for deposit received')}</span>
                  <Link href='/'>{t('Refresh')}</Link>
                </div>
              </div>
            </div>
          </div>
        </Box>
      </div>
    </div>
  )
}
