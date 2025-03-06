import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
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
import { cn, isInvalidAmount, wrappedAddress } from '@/lib/utils'
import SettingSlippageDropDown from '@/modules/Position/SettingSlippageDropDown'
import { useAprStore } from '@/state/APR/store'
import { Bound } from '@/state/fusion/actions'

import WarningZapper from '../components/WarningZapper'

function KyberZapperPane({ baseCurrency, quoteCurrency, deadline, mintInfo, strategy, onShowModalSuccess }) {
  const t = useTranslations()
  const { setAPRs } = useAprStore()

  const [token0, token1] = useMemo(() => {
    const [wrappedTokenA, wrappedTokenB] = [baseCurrency?.wrapped, quoteCurrency?.wrapped]
    if (!wrappedTokenA || !wrappedTokenB) return [null, null]

    return wrappedTokenA.sortsBefore(wrappedTokenB) ? [wrappedTokenA, wrappedTokenB] : [wrappedTokenB, wrappedTokenA]
  }, [baseCurrency?.wrapped, quoteCurrency?.wrapped])

  const asset0 = useGetAsset(token0.address)
  const asset1 = useGetAsset(token1.address)

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
    token0: tokenDeposit.address === asset0.address ? asset0 : null,
    token1: tokenDeposit.address === asset1.address ? asset1 : null,
    amount0: amountIn,
    amount1: amountIn,
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

  return (
    <div className='flex flex-col gap-8'>
      <div className='space-y-4'>
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
            assetsSelect={[asset0, asset1]}
          />
          <div className={cn('rounded-xl border border-neutral-600 bg-neutral-900 p-4 text-neutral-50 md:p-6 2xl:p-8')}>
            <p className='mb-1 text-xl font-medium'>Zapper Route</p>
            <ol className='list-inside list-decimal text-sm'>
              <li>
                Swap a portion of {tokenDeposit.symbol} to{' '}
                {wrappedAddress(tokenDeposit) === wrappedAddress(token0) ? token1.symbol : token0.symbol} to match the
                pool ratio.
              </li>
              <li>
                Deposit the remaining {tokenDeposit.symbol} and swapped{' '}
                {wrappedAddress(tokenDeposit) === wrappedAddress(token0) ? token1.symbol : token0.symbol} into the pool
                to receive LP tokens.
              </li>
            </ol>
          </div>
        </div>
      </div>

      {account ? (
        <PrimaryButton
          disabled={isFetching || !data?.route}
          onClick={() => {
            if (isInvalidAmount(amountIn) || BigNumber(amountIn).gt(tokenDeposit?.balance)) {
              warnToast('Invalid Amount')
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
          }}
          className='w-full'
        >
          {t('Add Liquidity')}
        </PrimaryButton>
      ) : (
        <ConnectButton className='w-full' />
      )}
    </div>
  )
}

export default KyberZapperPane
