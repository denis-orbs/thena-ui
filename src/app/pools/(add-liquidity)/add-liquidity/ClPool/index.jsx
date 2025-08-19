import { useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { WBNB } from 'thena-sdk-core'

import DepositCLPanel from '@/components/common/AddLiquidity/DepositCLPanel'
import HeaderCLSection from '@/components/common/AddLiquidity/HeaderCLSection'
import { RangeAndPricePanel } from '@/components/common/AddLiquidity/RangeAndPricePanel'
import { PAIR_TYPES } from '@/constant'
import { useCurrency, useGetAsset } from '@/hooks/fusion/Tokens'
import { usePositionInfo } from '@/hooks/usePositionInfo'
import { wrappedAddress } from '@/lib/utils'
import AutomaticLiquidityChart from '@/modules/Pools/AutomaticLiquidityChart'
import { Bound } from '@/state/fusion/actions'
import { useV3DerivedMintInfo, useV3MintActionHandlers, useV3MintState } from '@/state/fusion/hooks'
import { usePairInfo } from '@/state/pools/hooks'
import { useChainSettings } from '@/state/settings/hooks'

function AddLiquidityClPool({ pool, handleBack }) {
  const { networkId } = useChainSettings()
  const { isReverse } = useSelector(state => state.fusion)
  const { strategy } = useV3MintState()
  // const stableAssets = useStableTokens()

  const searchParams = useSearchParams()
  const type = searchParams.get('type')
  const poolAddress = searchParams.get('poolAddress') || pool?.address
  const firstAddress = searchParams.get('firstAddress') || pool?.token0?.address
  const secondAddress = searchParams.get('secondAddress') || pool?.token1?.address
  const pid = searchParams.get('pid')

  const position = usePositionInfo({ tokenId: pid, poolAddress, type })
  console.log({ position })
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
  const [isAutomatic, setIsAutomatic] = useState(strategy?.isAutomatic ?? false)
  const [lastPrice, setLastPrice] = useState(null)
  const [fullRangeWarningShown, setFullRangeWarningShown] = useState(true)

  useEffect(() => {
    setBaseCurrency(firstCurrency)
    setQuoteCurrency(secondCurrency)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position?.baseCurrency, isReverse, position?.quoteCurrency])

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

  useEffect(() => {
    if (!baseCurrency && firstCurrency && mintInfo.noLiquidity) {
      setBaseCurrency(firstCurrency)
    }
    if (!quoteCurrency && secondCurrency && mintInfo.noLiquidity) {
      setQuoteCurrency(secondCurrency)
    }
  }, [baseCurrency, firstCurrency, quoteCurrency, secondCurrency, mintInfo.noLiquidity])

  const currentPrice = useMemo(() => {
    if (position) {
      const isSorted = baseCurrency && quoteCurrency && baseCurrency?.wrapped.sortsBefore(quoteCurrency?.wrapped)
      return isSorted ? position.currentPrice : 1 / position.currentPrice
    }
    if (!mintInfo.price) return
    const price = mintInfo.invertPrice ? mintInfo.price.invert().toSignificant(5) : mintInfo.price.toSignificant(5)
    if (price) return parseFloat(price)
  }, [baseCurrency, mintInfo.invertPrice, mintInfo.price, position, quoteCurrency])

  useEffect(() => {
    setIsAutomatic(strategy?.isAutomatic ?? false)
  }, [strategy])

  return (
    <>
      <div className='flex flex-col gap-4'>
        <HeaderCLSection
          firstAsset={currencyA}
          secondAsset={currencyB}
          mintInfo={mintInfo}
          pair={pair}
          position={position}
          isAutomatic={isAutomatic}
          setIsAutomatic={setIsAutomatic}
          setFullRangeWarningShown={setFullRangeWarningShown}
          fullRangeWarningShown={fullRangeWarningShown}
          lastPrice={lastPrice}
          type={type}
        />
        {!strategy?.isAutomatic ? (
          <RangeAndPricePanel
            currencyA={baseCurrency ?? undefined}
            currencyB={quoteCurrency ?? undefined}
            mintInfo={mintInfo}
            currentPrice={currentPrice}
            position={position}
            priceLower={priceLower}
            priceUpper={priceUpper}
            onLeftRangeInput={onLeftRangeInput}
            onRightRangeInput={onRightRangeInput}
            setLastPrice={setLastPrice}
            viewMode={Boolean(position)}
          />
        ) : (
          <AutomaticLiquidityChart
            label='Liquidity Range'
            currencyA={currencyA ?? undefined}
            currencyB={currencyB ?? undefined}
            strategy={strategy}
            position={position}
            pair={pair}
            handleShow={!!strategy}
          />
        )}
        {!position && (
          <DepositCLPanel
            baseCurrency={baseCurrency}
            quoteCurrency={quoteCurrency}
            setBaseCurrency={isBaseBNB ? setBaseCurrency : null}
            setQuoteCurrency={isQuoteBNB ? setQuoteCurrency : null}
            mintInfo={mintInfo}
            currentPrice={currentPrice}
            strategy={strategy}
            // onShowModalSuccess={onShowModalSuccess}
            position={position}
            handleBack={handleBack}
            pair={pair}
          />
        )}
      </div>
    </>
  )
}

export default AddLiquidityClPool
