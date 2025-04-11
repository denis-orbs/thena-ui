import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { WBNB } from 'thena-sdk-core'

import ChooseStrategy from '@/components/common/AddLiquidity/ChooseStrategy'
import NewIconGroup from '@/components/icongroup/NewIconGroup'
import { NewTextHeading, NewTextSubHeading, Paragraph } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { useCurrency, useGetAsset } from '@/hooks/fusion/Tokens'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { usePositionInfo } from '@/hooks/usePositionInfo'
import { cn, wrappedAddress } from '@/lib/utils'
import AutomaticLiquidityChart from '@/modules/Pools/AutomaticLiquidityChart'
import LiquidityChartRangeInput from '@/modules/Pools/LiquidityChartRangeInput'
import { Bound } from '@/state/fusion/actions'
import { useV3DerivedMintInfo, useV3MintActionHandlers, useV3MintState } from '@/state/fusion/hooks'
import { usePairInfo } from '@/state/pools/hooks'
import { useChainSettings } from '@/state/settings/hooks'

import AddLiquidityCLPane from './AddLiquidityCLPane'
import { PoolAttributesSection } from '../PoolAttributesSection'
import PoolDescriptionSection from '../PoolTitleDescription'

function AddLiquidityClPool({ pool, handleBack }) {
  const t = useTranslations()
  const { isViewDown: is2XlDown } = useMediaQuery(1440)
  const { networkId } = useChainSettings()
  const { isReverse } = useSelector(state => state.fusion)
  const { strategy } = useV3MintState()

  const searchParams = useSearchParams()
  const type = searchParams.get('type')
  const poolAddress = searchParams.get('poolAddress') || pool?.address
  const firstAddress = searchParams.get('firstAddress') || pool?.token0?.address
  const secondAddress = searchParams.get('secondAddress') || pool?.token1?.address
  const pid = searchParams.get('pid')

  const position = usePositionInfo({ tokenId: pid, poolAddress, type })
  const firstAsset = useGetAsset(firstAddress)
  const secondAsset = useGetAsset(secondAddress)

  const currencyA = useCurrency(firstAddress)
  const currencyB = useCurrency(secondAddress)

  const [firstCurrency, secondCurrency] = useMemo(
    () =>
      position
        ? [position.baseCurrency, position.quoteCurrency]
        : isReverse
          ? [currencyB, currencyA]
          : [currencyA, currencyB],
    [position, isReverse, currencyB, currencyA],
  )

  const [baseCurrency, setBaseCurrency] = useState(firstCurrency)
  const [quoteCurrency, setQuoteCurrency] = useState(secondCurrency)

  useEffect(() => {
    setBaseCurrency(firstCurrency)
    setQuoteCurrency(secondCurrency)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReverse])

  const isBaseBNB = useMemo(
    () => baseCurrency?.wrapped?.address?.toLowerCase() === WBNB[networkId].address.toLowerCase(),
    [baseCurrency?.wrapped?.address, networkId],
  )

  const isQuoteBNB = useMemo(
    () => quoteCurrency?.wrapped?.address?.toLowerCase() === WBNB[networkId].address.toLowerCase(),
    [networkId, quoteCurrency?.wrapped.address],
  )

  const pair = usePairInfo({
    token0Address: wrappedAddress(firstAsset),
    token1Address: wrappedAddress(secondAsset),
    type: PAIR_TYPES.LSD,
    poolAddress,
  })

  const mintInfo = useV3DerivedMintInfo(baseCurrency, quoteCurrency, 3000, baseCurrency, undefined)
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = useMemo(() => mintInfo.pricesAtTicks, [mintInfo])
  const { onLeftRangeInput, onRightRangeInput } = useV3MintActionHandlers(mintInfo.noLiquidity)

  const currentPrice = useMemo(() => {
    if (position) return position.currentPrice
    if (!mintInfo.price) return
    const price = mintInfo.invertPrice ? mintInfo.price.invert().toSignificant(5) : mintInfo.price.toSignificant(5)
    if (price) return parseFloat(price)
  }, [mintInfo.invertPrice, mintInfo.price, position])

  return (
    <>
      <div className='flex flex-row items-center gap-4 md:gap-8'>
        <NewIconGroup logo1={firstAsset?.logoURI ?? UNKNOWN_LOGO} logo2={secondAsset?.logoURI ?? UNKNOWN_LOGO} />
        <NewTextHeading> {t('Add Liquidity')}</NewTextHeading>
      </div>

      <section className='mt-4 grid w-full grid-cols-1 gap-4 md:!mt-8 2xl:grid-cols-3'>
        <div id='LEFT-BLOCK' className='col-span-2 w-full'>
          <ChooseStrategy
            firstAsset={firstAsset}
            secondAsset={secondAsset}
            mintInfo={mintInfo}
            pair={pair}
            position={position}
          />

          {strategy?.isAutomatic && is2XlDown && (
            <div className='mt-4 space-y-4'>
              <NewTextSubHeading className='text-neutral-500'>{t('Liquidity Range')}</NewTextSubHeading>
              <AutomaticLiquidityChart
                currencyA={currencyA ?? undefined}
                currencyB={currencyB ?? undefined}
                onLeftRangeInput={onLeftRangeInput}
                onRightRangeInput={onRightRangeInput}
                strategy={strategy}
                position={position}
                pair={pair}
                handleShow={!!strategy}
              />
            </div>
          )}

          <AddLiquidityCLPane
            pool={pair}
            baseCurrency={baseCurrency}
            quoteCurrency={quoteCurrency}
            setBaseCurrency={isBaseBNB ? setBaseCurrency : null}
            setQuoteCurrency={isQuoteBNB ? setQuoteCurrency : null}
            mintInfo={mintInfo}
            position={position}
            handleBack={handleBack}
          />
        </div>

        <div id='RIGHT-BLOCK' className={cn('hidden', firstAddress && secondAddress && 'block')}>
          <div className='hidden h-full flex-[4] flex-col gap-2 2xl:flex'>
            {pair ? (
              <div className={cn('mt-0')}>
                <PoolAttributesSection strategy={strategy} pair={pair} />
              </div>
            ) : (
              <div className='flex h-max flex-col gap-3 rounded-md bg-neutral-800 p-4'>
                <NewTextHeading className='!text-xl'>{t('New Deposit')}</NewTextHeading>
                <Paragraph className='font-medium leading-5'>{t('New Deposit CL description')}</Paragraph>
              </div>
            )}

            <PoolDescriptionSection pairType={strategy?.title} />

            {strategy?.isAutomatic && (
              <div className='space-y-4 px-8'>
                <NewTextSubHeading className='text-neutral-500'>{t('Liquidity Range')}</NewTextSubHeading>
                <AutomaticLiquidityChart
                  currencyA={currencyA ?? undefined}
                  currencyB={currencyB ?? undefined}
                  onLeftRangeInput={onLeftRangeInput}
                  onRightRangeInput={onRightRangeInput}
                  strategy={strategy}
                  position={position}
                  pair={pair}
                  handleShow={!!strategy}
                />
              </div>
            )}

            {!strategy?.isAutomatic && (
              <div className={cn('sticky top-72 space-y-4 px-4')}>
                <NewTextSubHeading className='text-neutral-500'>{t('Liquidity Distribution')}</NewTextSubHeading>
                <LiquidityChartRangeInput
                  currencyA={baseCurrency ?? undefined}
                  currencyB={quoteCurrency ?? undefined}
                  feeAmount={mintInfo.dynamicFee}
                  ticksAtLimit={position?.ticksAtLimit ?? mintInfo.ticksAtLimit}
                  price={currentPrice ? parseFloat(currentPrice) : undefined}
                  priceLower={position?.priceLower ?? priceLower}
                  priceUpper={position?.priceUpper ?? priceUpper}
                  onLeftRangeInput={onLeftRangeInput}
                  onRightRangeInput={onRightRangeInput}
                  interactive={false}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

export default AddLiquidityClPool
