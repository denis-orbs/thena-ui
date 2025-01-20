import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import { zeroAddress } from 'viem'

import { PrimaryButton, SecondaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import TokenInput from '@/components/input/TokenInput'
import Tabs from '@/components/tabs'
import { Paragraph, TextHeading } from '@/components/typography'
import useDebounce from '@/hooks/useDebounce'
import useWallet from '@/hooks/useWallet'
import { useV1Zapper } from '@/hooks/zapper/useZapper'
import { cn, formatAmount, unwrappedSymbol } from '@/lib/utils'

function ZapperPane({ asset0, asset1, slippage = 1, strategy }) {
  const { address: pairAddress, gauge } = strategy
  const zapSwapSlippage = 10000 - slippage * 100

  const t = useTranslations()
  const { account } = useWallet()
  const [tokensData] = useState([asset1, asset0])
  const [tokenDeposit, setTokenDeposit] = useState(asset1)

  const { onAddLiquidity } = useV1Zapper()

  const [amount, setAmount] = useState(0)
  const amountIn = useDebounce(amount, 500)

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

      {strategy && (
        <>
          <div className='flex flex-col gap-4'>
            <TextHeading className='text-lg'>{t('Reserve Info')}</TextHeading>
            <div className='flex flex-col gap-3'>
              <div className='flex items-center justify-between'>
                <Paragraph className='font-medium'>
                  {unwrappedSymbol(strategy.token0)} {t('Amount')}
                </Paragraph>
                <Paragraph>{formatAmount(strategy.token0.reserve)}</Paragraph>
              </div>
              <div className='flex items-center justify-between'>
                <Paragraph className='font-medium'>
                  {unwrappedSymbol(strategy.token1)} {t('Amount')}
                </Paragraph>
                <Paragraph>{formatAmount(strategy.token1.reserve)}</Paragraph>
              </div>
            </div>
          </div>
          <div className='mt-4 flex flex-col gap-4 border-t border-neutral-700 pt-4'>
            <TextHeading className='text-lg'>{t('My Info')}</TextHeading>
            <div className='flex flex-col gap-3'>
              <div className='flex items-center justify-between'>
                <Paragraph className='font-medium'>{t('Pooled Liquidity')}</Paragraph>
                <Paragraph>{formatAmount(strategy.account.totalLp)} LP</Paragraph>
              </div>
              <div className='flex items-center justify-between'>
                <Paragraph className='font-medium'>{t('Staked Liquidity')}</Paragraph>
                <Paragraph>{formatAmount(strategy.account.gaugeBalance)} LP</Paragraph>
              </div>
            </div>
          </div>
        </>
      )}

      {account ? (
        <div className={cn('mt-auto flex w-full flex-col items-center gap-4 pt-5 lg:flex-row')}>
          <SecondaryButton
            disabled={!amountIn}
            onClick={() => {
              onAddLiquidity({
                token: tokenDeposit,
                amount: amountIn,
                gaugeAddress: null,
                pairAddress,
                zapSwapSlippage,
              })
            }}
            className='w-full'
          >
            {t('Add Liquidity')}
          </SecondaryButton>

          <PrimaryButton
            disabled={!amountIn}
            onClick={() => {
              onAddLiquidity({
                token: tokenDeposit,
                amount: amountIn,
                gaugeAddress: gauge?.address ?? null,
                pairAddress,
                zapSwapSlippage,
              })
            }}
            className={cn('w-full', !gauge && 'hidden', gauge?.address === zeroAddress && 'hidden')}
          >
            {t('Add Liquidity & Stake')}
          </PrimaryButton>
        </div>
      ) : (
        <ConnectButton className='w-full' />
      )}
    </div>
  )
}

export default ZapperPane
