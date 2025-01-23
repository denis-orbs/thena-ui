import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import { formatEther } from 'viem'

import { PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import { ThreeIconGroup } from '@/components/icongroup/ThreeIconGroup'
import TokenInput from '@/components/input/TokenInput'
import Tabs from '@/components/tabs'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { MANUAL_TYPES } from '@/constant'
import { useGetAsset } from '@/hooks/fusion/Tokens'
import { useEstimateAPR } from '@/hooks/fusion/useEstimateAPR'
import { usePoolAlgebraInfo } from '@/hooks/fusion/usePoolAlgebraInfo'
import useDebounce from '@/hooks/useDebounce'
import useWallet from '@/hooks/useWallet'
import { useGetZapInRoute, useZapperAddLiquidity } from '@/hooks/zapper/useZapper'
import { cn, formatAmount, unwrappedSymbol } from '@/lib/utils'
import { Bound } from '@/state/fusion/actions'
import { ArrowRightIcon, InfoIcon } from '@/svgs'

function ZapperPane({ baseCurrency, quoteCurrency, slippage, deadline, mintInfo, strategy }) {
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
  const apr = useEstimateAPR({
    pool: mintInfo.pool,
    poolAddress: mintInfo.poolAddress,
    tickUpper,
    tickLower,
    token0: tokenDeposit.address === asset0.address ? asset0 : null,
    token1: tokenDeposit.address === asset1.address ? asset1 : null,
    amount0: amountIn,
    amount1: amountIn,
    isFarming: strategy?.title === MANUAL_TYPES[0],
    tvl: strategy?.tvl,
  })

  const { poolAddress, customPoolAddress } = usePoolAlgebraInfo(asset0.address, asset1.address)

  const { data, isFetching } = useGetZapInRoute({
    tickLower,
    tickUpper,
    poolId: strategy?.isFarming ? poolAddress : customPoolAddress,
    tokenIn: tokenDeposit,
    amountIn,
    slippage: slippage * 100,
  })

  const percents = useMemo(
    () => [
      {
        label: '10%',
        onClickHandler: () => setAmount(tokenDeposit?.balance.times(0.1).toString(10)),
      },
      {
        label: '25%',
        onClickHandler: () => setAmount(tokenDeposit?.balance.times(0.25).toString(10)),
      },
      {
        label: '50%',
        onClickHandler: () => setAmount(tokenDeposit?.balance.times(0.5).toString(10)),
      },
      {
        label: 'Max',
        onClickHandler: () => setAmount(tokenDeposit?.balance.toString(10)),
      },
    ],
    [tokenDeposit?.balance, setAmount],
  )

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex flex-row justify-between'>
        <TextHeading>{t('Deposit Token')}</TextHeading> <Tabs data={percents} />
      </div>
      <div className='relative flex w-full flex-col gap-2'>
        <TokenInput
          asset={tokenDeposit}
          setAsset={setTokenDeposit}
          amount={amount}
          setAmount={setAmount}
          autoFocus
          assetData={[asset0, asset1]}
          assetNull
        />
      </div>

      <ArrowRightIcon className='mx-auto h-5 w-5 rotate-90' />

      <TextHeading>Liquidity</TextHeading>
      <div className='flex flex-col gap-3 self-stretch rounded-xl border border-neutral-700 p-4'>
        <div className='flex items-center justify-between gap-2'>
          <input
            type='number'
            className='w-full flex-[4] border-0 bg-transparent p-0 text-xl text-neutral-50 placeholder-neutral-400'
            placeholder='0.0'
            value={formatEther(data?.positionDetails?.addedLiquidity ?? 0n)}
            readOnly
          />
          <div
            className={cn(
              'inline-flex items-center justify-center gap-2',
              'rounded-full bg-neutral-600 text-sm text-neutral-200',
              'max-w-[60%] py-1.5 pl-1.5 pr-2',
            )}
          >
            <ThreeIconGroup
              logo1={asset0.logoURI}
              logo2={asset1.logoURI}
              classNames={{ image: 'w-6 h-6' }}
              className='-space-x-1'
            />
            <span className='text-wrap'>
              {asset0.symbol}-{asset1.symbol}
            </span>
          </div>
        </div>

        <div className='flex items-center justify-between gap-2'>
          <TextSubHeading>${data?.positionDetails?.addedAmountUsd ?? 0}</TextSubHeading>
        </div>
      </div>

      <div className='mb-5'>
        <div className='my-2 flex flex-row justify-between'>
          <Paragraph>{t('Total Deposit')}</Paragraph>
          <Paragraph>${data?.zapDetails?.finalAmountUsd ?? 0}</Paragraph>
        </div>

        <div className='mt-5 flex items-center justify-between'>
          <Paragraph className='font-medium'>Estimated APR</Paragraph>
          <Paragraph className='flex items-center gap-1'>
            {apr?.toFixed(2)}%
            <InfoIcon className='ml-1 h-4 w-4 stroke-neutral-400' data-tooltip-id='apr-info' />
          </Paragraph>

          <CustomTooltip id='apr-info' className='max-w-[320px]'>
            Estimated return based on monthly trade fees and farming yield
          </CustomTooltip>
        </div>

        <div className='mt-5 flex flex-col gap-4 border-t border-neutral-700 pt-4'>
          <TextHeading className='text-lg'>{t('Reserve Info')}</TextHeading>
          <div className='flex flex-col gap-3'>
            <div className='flex items-center justify-between'>
              <Paragraph className='font-medium'>
                {unwrappedSymbol(strategy?.token0)} {t('Amount')}
              </Paragraph>
              <Paragraph>{formatAmount(strategy?.token0?.reserve)}</Paragraph>
            </div>
            <div className='flex items-center justify-between'>
              <Paragraph className='font-medium'>
                {unwrappedSymbol(strategy?.token1)} {t('Amount')}
              </Paragraph>
              <Paragraph>{formatAmount(strategy?.token1?.reserve)}</Paragraph>
            </div>
          </div>
        </div>

        <div className='mt-5 flex flex-col gap-4 border-t border-neutral-700 pt-4'>
          <TextHeading className='text-lg'>{t('My Info')}</TextHeading>
          <div className='flex flex-col gap-3'>
            <div className='flex items-center justify-between'>
              <Paragraph className='font-medium'>{t('Pooled Liquidity')}</Paragraph>
              <Paragraph>{formatAmount(strategy?.account?.totalLp)} LP</Paragraph>
            </div>
          </div>
        </div>
      </div>

      {account ? (
        <PrimaryButton
          disabled={isFetching || !data?.route}
          onClick={() => {
            handleAddLiquidity({
              route: data?.route,
              mintInfo,
              deadline,
              amount: amountIn,
              token: tokenDeposit,
              isFarming: Boolean(strategy?.isFarming),
            })
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

export default ZapperPane
