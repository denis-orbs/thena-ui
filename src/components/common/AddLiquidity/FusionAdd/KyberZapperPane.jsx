import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import { TokenAmountInput } from '@/components/input/TokenAmountInput'
import { useGetAsset, useTokenBalance } from '@/hooks/fusion/Tokens'
import { usePoolAlgebraInfo } from '@/hooks/fusion/usePoolAlgebraInfo'
import useDebounce from '@/hooks/useDebounce'
import useWallet from '@/hooks/useWallet'
import { useGetZapInRoute, useZapperAddLiquidity } from '@/hooks/zapper/useZapper'
import { warnToast } from '@/lib/notify'
import { fromWei, isInvalidAmount, toWei } from '@/lib/utils'
import { Bound } from '@/state/fusion/actions'

function KyberZapperPane({ baseCurrency, quoteCurrency, slippage, deadline, mintInfo, strategy, onShowModalSuccess }) {
  const t = useTranslations()

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

  const { data, isFetching } = useGetZapInRoute({
    tickLower,
    tickUpper,
    poolId: strategy?.isFarming ? poolAddress : customPoolAddress,
    tokenIn: tokenDeposit,
    amountIn,
    slippage: slippage * 100,
  })

  const { balance, isDouble } = useTokenBalance(tokenDeposit, true)

  return (
    <div className='flex flex-col gap-2'>
      <div className='relative flex w-full flex-col gap-2'>
        <TokenAmountInput
          type='number'
          amount={amount}
          setAsset={setTokenDeposit}
          asset={tokenDeposit}
          maxBalance={isDouble ? balance : null}
          autoFocus
          onAmountChange={setAmount}
          showPercent={false}
          assetsSelect={[asset0, asset1]}
        />
      </div>

      {account ? (
        <PrimaryButton
          disabled={isFetching || !data?.route}
          onClick={() => {
            if (
              fromWei(toWei(amountIn, tokenDeposit?.decimals), tokenDeposit?.decimals).gt(balance) ||
              isInvalidAmount(amountIn)
            ) {
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
