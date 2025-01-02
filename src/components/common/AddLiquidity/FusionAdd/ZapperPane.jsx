import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import { ThreeIconGroup } from '@/components/icongroup/ThreeIconGroup'
import TokenInput from '@/components/input/TokenInput'
import Tabs from '@/components/tabs'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { usePoolAlgebraInfo } from '@/hooks/fusion/usePoolAlgebraInfo'
import useWallet from '@/hooks/useWallet'
import { useGetZapInRoute, useZapperAddLiquidity } from '@/hooks/zapper/useZapper'
import { cn, formatAmount } from '@/lib/utils'
import { ArrowRightIcon } from '@/svgs'

function ZapperPane({ asset1, asset2, slippage, tickLower, tickUpper, deadline, mintInfo, strategy }) {
  const t = useTranslations()
  const { account } = useWallet()
  const [tokensData] = useState([asset1, asset2])
  const [tokenDeposit, setTokenDeposit] = useState(asset1)
  const { handleAddLiquidity } = useZapperAddLiquidity()

  const [amount, setAmount] = useState(0)

  const { poolAddress, customPoolAddress } = usePoolAlgebraInfo(asset1.address, asset2.address)

  const { data, isFetching } = useGetZapInRoute({
    tickLower,
    tickUpper,
    poolId: strategy?.isFarming ? poolAddress : customPoolAddress,
    tokenIn: tokenDeposit,
    amountIn: amount,
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
          assetData={tokensData}
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
            value={formatAmount(data?.positionDetails?.addedAmount ?? 0)}
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
              logo1={asset1.logoURI}
              logo2={asset2.logoURI}
              classNames={{ image: 'w-6 h-6' }}
              className='-space-x-1'
            />
            <span className='text-wrap'>
              {asset1.symbol}-{asset2.symbol}
            </span>
          </div>
        </div>

        <div className='flex items-center justify-between gap-2'>
          <TextSubHeading>${data?.positionDetails?.addedAmountUsd ?? 0}</TextSubHeading>
        </div>
      </div>

      <div className='my-2 flex flex-row justify-between'>
        <TextSubHeading>{t('Total Deposit')}</TextSubHeading>
        <Paragraph>${data?.zapDetails?.finalAmountUsd ?? 0}</Paragraph>
      </div>

      {account ? (
        <PrimaryButton
          disabled={isFetching || !data?.route}
          onClick={() => {
            handleAddLiquidity({
              route: data?.route,
              mintInfo,
              deadline,
              amount,
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
