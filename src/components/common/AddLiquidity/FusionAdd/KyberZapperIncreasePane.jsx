import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useState } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import IconGroup from '@/components/icongroup'
import { TokenAmountInput } from '@/components/input/TokenAmountInput'
import { TextSubHeading } from '@/components/typography'
import { useGetAsset } from '@/hooks/fusion/Tokens'
import useDebounce from '@/hooks/useDebounce'
import useWallet from '@/hooks/useWallet'
import { useGetZapInRouteForExisting, useKyberZapperAddLiquidity } from '@/hooks/zapper/useZapper'
import { warnToast } from '@/lib/notify'
import { cn, formatAmount, fromWei, isInvalidAmount } from '@/lib/utils'

function KyberZapperIncreasePane({ position, onShowModalSuccess, slippage = 0.5, classNames }) {
  const t = useTranslations()
  const { account } = useWallet()
  const { handleIncreaseLiquidity } = useKyberZapperAddLiquidity()

  const [amount, setAmount] = useState(0)

  const amountIn = useDebounce(amount, 500)

  const asset0 = useGetAsset(position.baseCurrency.address)
  const asset1 = useGetAsset(position.quoteCurrency.address)
  const BNB = useGetAsset('BNB')

  const [tokenDeposit, setTokenDeposit] = useState(asset0)

  const { _position } = position
  const { data, isFetching } = useGetZapInRouteForExisting({
    tokenId: _position.tokenId,
    poolId: _position.poolAddress,
    // tickLower: _position.tickLower,
    // tickUpper: _position.tickUpper,
    tokenIn: tokenDeposit,
    amountIn: Number(amountIn) || 1,
    slippage: slippage * 100,
  })

  const tokens = useMemo(
    () => ({
      [asset0.address]: asset0,
      [asset1.address]: asset1,
    }),
    [asset0, asset1],
  )

  const [liquidityAdded, addLiquidityAction, swaps] = useMemo(() => {
    const liquidityData = data?.positionDetails?.addedLiquidity
    const liquidityAction = data?.zapDetails?.actions.find(action => action.type.includes('ADD_LIQUIDITY'))
    const swapsData = data?.zapDetails?.actions
      .filter(action => action.type.includes('SWAP'))
      .flatMap(entry => entry.aggregatorSwap?.swaps || entry.poolSwap?.swaps || [])

    return [liquidityData, liquidityAction, swapsData]
  }, [data])

  const [_token0, _token1] = useMemo(() => {
    const tk0 = tokens[addLiquidityAction?.addLiquidity?.token0?.address?.toLowerCase()]
    const tk1 = tokens[addLiquidityAction?.addLiquidity?.token1?.address?.toLowerCase()]
    return [tk0, tk1]
  }, [addLiquidityAction, tokens])

  const handleKyberIncreaseLiquidity = useCallback(() => {
    if (isInvalidAmount(amountIn)) {
      warnToast('Invalid Amount')
      return false
    }

    if (BigNumber(amountIn).gt(tokenDeposit?.balance)) {
      warnToast('Insufficient Balance')
      return false
    }

    handleIncreaseLiquidity(
      {
        route: data?.route,
        amount: amountIn,
        token: tokenDeposit,
      },
      onShowModalSuccess,
    )
  }, [amountIn, data?.route, handleIncreaseLiquidity, onShowModalSuccess, tokenDeposit])

  return (
    <div className='mt-2! flex flex-col md:gap-4'>
      <div className='flex flex-col gap-2 md:gap-4'>
        <TokenAmountInput
          type='number'
          amount={amount}
          setAsset={setTokenDeposit}
          asset={tokenDeposit}
          autoFocus
          onAmountChange={setAmount}
          showPercent={false}
          assetsSelect={[asset0, asset1, BNB]}
          classNames={{ input: 'xl:text-4 xl:leading-5', maxBtn: 'xl:font-medium', inputWrapper: classNames?.input }}
          isSmall
        />

        <div
          className={cn(
            'flex gap-3 rounded-xl border border-neutral-600 bg-neutral-900 p-4 text-neutral-50 md:p-6 2xl:p-8',
            (!amountIn || !data) && 'hidden',
          )}
        >
          <article className='flex flex-col gap-2'>
            <div className='flex items-center justify-center gap-1 rounded-md bg-[#29292980] p-[6px]'>
              <IconGroup
                className='*:not-first:-ml-2'
                classNames={{
                  image: 'outline-2 w-7 h-7',
                }}
                logo1={asset0.logoURI}
                logo2={asset1.logoURI}
              />
              <p className='hidden text-sm text-neutral-200 md:block'>
                {asset0.symbol}/{asset1.symbol}
              </p>
            </div>
            <p className='flex gap-2'>
              <span>{formatAmount(fromWei(liquidityAdded))}</span>
              <TextSubHeading className='text-sm'>LP</TextSubHeading>
            </p>
          </article>
          <article>
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
          </article>
        </div>
      </div>

      <div className='mt-2 flex w-full flex-col items-center xl:flex-row'>
        {account ? (
          <PrimaryButton
            className='w-full'
            onClick={handleKyberIncreaseLiquidity}
            disabled={!data || isFetching || !amountIn}
          >
            {t('Deposit')}
          </PrimaryButton>
        ) : (
          <ConnectButton className='w-full' />
        )}
      </div>
    </div>
  )
}

export default KyberZapperIncreasePane
