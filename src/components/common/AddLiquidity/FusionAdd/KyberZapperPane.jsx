import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import { TokenAmountInput } from '@/components/input/TokenAmountInput'
import { MANUAL_TYPES } from '@/constant'
import { useGetAsset } from '@/hooks/fusion/Tokens'
import { useEstimateAPR } from '@/hooks/fusion/useEstimateAPR'
import { usePoolAlgebraInfo } from '@/hooks/fusion/usePoolAlgebraInfo'
import useDebounce from '@/hooks/useDebounce'
import useWallet from '@/hooks/useWallet'
import { useGetZapInRoute, useZapperAddLiquidity } from '@/hooks/zapper/useZapper'
import { warnToast } from '@/lib/notify'
import { cn, formatAmount, fromWei, isInvalidAmount } from '@/lib/utils'
import SettingSlippageDropDown from '@/modules/Position/SettingSlippageDropDown'
import { useAprStore } from '@/state/APR/store'
import { Bound } from '@/state/fusion/actions'

import WarningZapper from '../components/WarningZapper'

function KyberZapperPane({
  baseCurrency,
  quoteCurrency,
  deadline,
  mintInfo,
  strategy,
  onShowModalSuccess,
  handleBack,
}) {
  const t = useTranslations()
  const { setAPRs } = useAprStore()

  const [token0, token1] = useMemo(() => {
    const [wrappedTokenA, wrappedTokenB] = [baseCurrency?.wrapped, quoteCurrency?.wrapped]
    if (!wrappedTokenA || !wrappedTokenB) return [null, null]

    return wrappedTokenA.sortsBefore(wrappedTokenB) ? [wrappedTokenA, wrappedTokenB] : [wrappedTokenB, wrappedTokenA]
  }, [baseCurrency?.wrapped, quoteCurrency?.wrapped])

  const asset0 = useGetAsset(token0.address)
  const asset1 = useGetAsset(token1.address)
  const BNB = useGetAsset('BNB')

  const isToken0Wbnb = useMemo(() => asset0?.symbol === 'WBNB', [asset0])
  const isToken1Wbnb = useMemo(() => asset1?.symbol === 'WBNB', [asset1])

  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = useMemo(() => mintInfo.ticks, [mintInfo])

  const { account } = useWallet()
  const [tokenDeposit, setTokenDeposit] = useState(asset0)
  const { handleAddLiquidity } = useZapperAddLiquidity()

  const [amount, setAmount] = useState(0)
  const amountIn = useDebounce(amount, 500)

  const { poolAddress, customPoolAddress } = usePoolAlgebraInfo(asset0.address, asset1.address)

  const [slippage, setSlippage] = useState(0.5)

  const estimateAPR = useEstimateAPR({
    pool: mintInfo.pool,
    poolAddress: mintInfo.poolAddress,
    tickUpper,
    tickLower,
    token0: (tokenDeposit.address === 'BNB' && isToken0Wbnb) || tokenDeposit.address === asset0.address ? asset0 : null,
    token1: (tokenDeposit.address === 'BNB' && isToken1Wbnb) || tokenDeposit.address === asset1.address ? asset1 : null,
    amount0: Number(amountIn),
    amount1: Number(amountIn),
    isFarming: strategy?.title === MANUAL_TYPES[0],
  })

  useEffect(() => {
    setAPRs(estimateAPR)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountIn, tokenDeposit.address, tickUpper, tickLower])

  const { data, isFetching } = useGetZapInRoute({
    tickLower,
    tickUpper,
    poolId: strategy?.isFarming ? poolAddress : customPoolAddress,
    tokenIn: tokenDeposit,
    amountIn,
    slippage: slippage * 100,
  })

  const tokens = {
    [asset0.address]: asset0,
    [asset1.address]: asset1,
  }
  const swaps = data?.zapDetails?.actions
    .filter(action => action.type.includes('SWAP'))
    .flatMap(entry => entry.aggregatorSwap?.swaps || entry.poolSwap?.swaps || [])

  const liquidityAdded = data?.positionDetails?.addedLiquidity
  const addLiquidityAction = data?.zapDetails?.actions.find(action => action.type.includes('ADD_LIQUIDITY'))
  const _token0 = tokens[addLiquidityAction?.addLiquidity?.token0?.address?.toLowerCase()]
  const _token1 = tokens[addLiquidityAction?.addLiquidity?.token1?.address?.toLowerCase()]

  const handleKyberAddLiquidity = useCallback(() => {
    if (isInvalidAmount(amountIn) || BigNumber(amountIn).gt(tokenDeposit?.balance)) {
      warnToast('Invalid Amount')
      return false
    }

    if (BigNumber(amountIn).times(tokenDeposit.price).lte(5)) {
      warnToast('Minimum deposit')
      return false
    }

    handleAddLiquidity(
      {
        route: data?.route,
        mintInfo,
        deadline,
        amount: amountIn,
        token: tokenDeposit,
        isFarming: Boolean(strategy?.isFarming),
      },
      onShowModalSuccess,
    )
  }, [
    amountIn,
    data?.route,
    deadline,
    handleAddLiquidity,
    mintInfo,
    onShowModalSuccess,
    strategy?.isFarming,
    tokenDeposit,
  ])

  return (
    <div className='!mt-4 flex flex-col md:gap-4 lg:gap-8'>
      <div className='space-y-2 md:space-y-4'>
        <WarningZapper />
        <SettingSlippageDropDown slippage={slippage} updateSlippage={setSlippage} className='mb-0' />
        <div className='relative flex w-full flex-col gap-2'>
          <TokenAmountInput
            type='number'
            amount={amount}
            setAsset={setTokenDeposit}
            asset={tokenDeposit}
            autoFocus
            onAmountChange={setAmount}
            showPercent={false}
            assetsSelect={[asset0, asset1, (isToken0Wbnb || isToken1Wbnb) && BNB]}
          />

          <div
            className={cn(
              'rounded-xl border border-neutral-600 bg-neutral-900 p-4 text-neutral-50 md:p-6 2xl:p-8',
              !data && 'hidden',
            )}
          >
            <p className='mb-1 text-xl font-medium'>Zapper Route</p>
            <ol className='list-inside list-decimal text-sm'>
              {swaps?.map((a, index) => {
                const tokenIn = tokens[a.tokenIn.address.toLowerCase()]
                const tokenOut = tokens[a.tokenOut.address.toLowerCase()]

                return (
                  <li key={index}>
                    Swap {formatAmount(fromWei(a.tokenIn.amount, tokenIn?.decimals))} {tokenIn?.symbol} to{' '}
                    {formatAmount(fromWei(a.tokenOut.amount, tokenOut?.decimals))} {tokenOut?.symbol}
                  </li>
                )
              })}

              <li>
                Build LP using{' '}
                {formatAmount(fromWei(addLiquidityAction?.addLiquidity?.token0?.amount, _token0?.decimals))}{' '}
                {_token0?.symbol} and{' '}
                {formatAmount(fromWei(addLiquidityAction?.addLiquidity?.token1?.amount, _token1?.decimals))}{' '}
                {_token1?.symbol} on THENA
              </li>
              <li>
                Deposit estimated {formatAmount(fromWei(liquidityAdded))} {asset0.symbol}/{asset1.symbol} LP
              </li>
            </ol>
          </div>
        </div>
      </div>

      <div className='flex w-full flex-col items-center gap-2 max-md:!mt-8 lg:flex-row'>
        <EmphasisButton className='block w-full md:hidden' onClick={handleBack}>
          {t('Cancel')}
        </EmphasisButton>
        {account ? (
          <PrimaryButton disabled={isFetching || !data?.route} onClick={handleKyberAddLiquidity} className='w-full'>
            {t('Add Liquidity')}
          </PrimaryButton>
        ) : (
          <ConnectButton className='w-full' />
        )}
      </div>
    </div>
  )
}

export default KyberZapperPane
