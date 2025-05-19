import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { WBNB } from 'thena-sdk-core'

import Box from '@/components/box'
import ChooseStrategy from '@/components/common/AddLiquidity/ChooseStrategy'
import ChartPriceRangeInput from '@/components/common/AddLiquidity/FusionAdd/LiquidityChartRangeInput/ChartPriceRangeInput'
import NewIconGroup from '@/components/icongroup/NewIconGroup'
import { NewTextHeading, NewTextSubHeading, TextHeading } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { useCurrency, useGetAsset } from '@/hooks/fusion/Tokens'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { usePositionInfo } from '@/hooks/usePositionInfo'
import { cn, wrappedAddress } from '@/lib/utils'
import AutomaticLiquidityChart from '@/modules/Pools/AutomaticLiquidityChart'
import LiquidityChartRangeInput from '@/modules/Pools/LiquidityChartRangeInput'
import { NormalPoolAttributes, PoolAttributesCL } from '@/modules/Pools/PoolAttributes'
import { Bound } from '@/state/fusion/actions'
import { useV3DerivedMintInfo, useV3MintActionHandlers, useV3MintState } from '@/state/fusion/hooks'
import { usePairInfo } from '@/state/pools/hooks'
import { useChainSettings } from '@/state/settings/hooks'
import { InfoIcon } from '@/svgs'

import AddLiquidityCLPane from './AddLiquidityCLPane'

function AddLiquidityClPool({ pool, handleBack }) {
  const t = useTranslations()
  const { isViewDown: isXlDown } = useMediaQuery(1280)
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
  const [isAutomatic, setIsAutomatic] = useState(false)
  const [show, setShow] = useState(false)
  // const [lastPrice, setLastPrice] = useState(null)
  const [fullRangeWarningShown, setFullRangeWarningShown] = useState(true)

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
      <div className='flex flex-col'>
        <div className='flex flex-row items-center gap-4 md:gap-8'>
          <NewIconGroup logo1={firstAsset?.logoURI ?? UNKNOWN_LOGO} logo2={secondAsset?.logoURI ?? UNKNOWN_LOGO} />
          <NewTextHeading className='xl:text-4xl'> {t('Add Liquidity')}</NewTextHeading>
        </div>
        <div className='flex w-full flex-row items-center justify-between gap-4 max-xl:hidden'>
          <NewTextSubHeading>{isAutomatic ? t('Automated Strategies') : t('Concentrated Liquidity')}</NewTextSubHeading>
          {pair ? (
            <div className={cn('mt-0')}>
              <div className='flex w-full items-center justify-between gap-2'>
                <Box className={cn('flex w-full rounded-lg bg-neutral-900 !py-1.5 !pl-4')}>
                  <TextHeading className='!text-xl !font-medium text-neutral-500'>{t('Pool Attributes')}</TextHeading>
                </Box>

                <div className='flex items-center'>
                  <i
                    onClick={() => setShow(!show)}
                    className={cn(
                      'flex cursor-pointer items-center justify-center rounded-lg',
                      'size-8 min-w-8 md:size-11 md:min-w-11',
                      show ? 'bg-neutral-600' : 'bg-neutral-900',
                    )}
                  >
                    <InfoIcon className='size-4 stroke-neutral-400 md:size-5' />
                  </i>
                </div>
              </div>
            </div>
          ) : (
            // <div className='flex h-max flex-col gap-3 rounded-md bg-neutral-800 p-4'>
            //   <NewTextHeading className='!text-xl'>{t('New Deposit')}</NewTextHeading>
            //   <Paragraph className='font-medium leading-5'>{t('New Deposit CL description')}</Paragraph>
            // </div>
            <></>
          )}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 0, height: 0 }}
          animate={show ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: 0, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className='overflow-hidden'
        >
          <div className='mt-2 w-full'>
            {pair?.type === PAIR_TYPES.LSD ? (
              <>{strategy && pair && <PoolAttributesCL strategy={strategy} pool={pair} />}</>
            ) : (
              <>{pair && <NormalPoolAttributes pool={pair} />}</>
            )}
          </div>
        </motion.div>
      </div>
      <section className='mt-4 grid w-full grid-cols-1 gap-4 xl:grid-cols-2'>
        <div id='LEFT-BLOCK' className='col-span-1 w-full'>
          <ChooseStrategy
            firstAsset={firstAsset}
            secondAsset={secondAsset}
            mintInfo={mintInfo}
            pair={pair}
            position={position}
            isAutomatic={isAutomatic}
            setIsAutomatic={setIsAutomatic}
            setFullRangeWarningShown={setFullRangeWarningShown}
            fullRangeWarningShown={fullRangeWarningShown}
          />

          {strategy?.isAutomatic && isXlDown && (
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
          <div className='hidden h-full flex-[4] flex-col gap-2 md:gap-4 xl:flex'>
            {/* <PoolDescriptionSection pairType={strategy?.title} /> */}
            {!isAutomatic && (
              <ChartPriceRangeInput
                currencyA={baseCurrency ?? undefined}
                currencyB={quoteCurrency ?? undefined}
                feeAmount={mintInfo.dynamicFee}
                ticksAtLimit={position?.ticksAtLimit ?? mintInfo.ticksAtLimit}
                price={currentPrice ? parseFloat(currentPrice) : undefined}
                priceLower={position?.priceLower ?? priceLower}
                priceUpper={position?.priceUpper ?? priceUpper}
                onLeftRangeInput={onLeftRangeInput}
                onRightRangeInput={onRightRangeInput}
                interactive={!position}
                showPeriod
                handleShow
                outOfRange={mintInfo.outOfRange}
                invalidRange={mintInfo.invalidRange}
                fullRangeWarningShown={fullRangeWarningShown}
                isCreate={mintInfo.noLiquidity}
                setLastPrice={() => {}}
                height={203}
              />
            )}
            {strategy?.isAutomatic && (
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
            )}

            {!strategy?.isAutomatic && (
              <LiquidityChartRangeInput
                label='Liquidity Distribution'
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
                height={221}
              />
            )}
          </div>
        </div>
      </section>
    </>
  )
}

export default AddLiquidityClPool
