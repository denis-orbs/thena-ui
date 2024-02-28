import React, { useMemo } from 'react'
import { WBNB } from 'thena-sdk-core'

import Highlight from '@/components/highlight'
import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import Tabs from '@/components/tabs'
import { Paragraph, TextSubHeading } from '@/components/typography'
import { FusionRangeType } from '@/constant'
import { useCurrency } from '@/hooks/fusion/Tokens'
import { useCurrencyBalance } from '@/hooks/fusion/useCurrencyBalances'
import { useCurrencyLogo, useCurrencyPrice } from '@/hooks/fusion/useCurrencyLogo'
import { cn, formatAmount } from '@/lib/utils'
import { useChainSettings } from '@/state/settings/hooks'
import { LockIcon } from '@/svgs'

export function TokenAmountCard({
  currency,
  value,
  maxAmount,
  handleInput,
  locked = false,
  liquidityRangeType = FusionRangeType.MANUAL_RANGE,
  title,
}) {
  const { networkId } = useChainSettings()
  const bnb = useCurrency('BNB')
  const balance = useCurrencyBalance(currency)
  const bnbBalance = useCurrencyBalance(bnb)
  const wBnbBalance = useCurrencyBalance(WBNB[networkId])
  const logoURI = useCurrencyLogo(currency)
  const price = useCurrencyPrice(currency)

  const isDouble = useMemo(
    () =>
      [FusionRangeType.GAMMA_RANGE, FusionRangeType.DEFIEDGE_RANGE, FusionRangeType.ICHI_RANGE].includes(
        liquidityRangeType,
      ) &&
      networkId &&
      currency?.wrapped.address.toLowerCase() === WBNB[networkId].address.toLowerCase(),
    [liquidityRangeType, currency, networkId],
  )

  const balanceString = useMemo(() => {
    if (!balance) return 'Loading'

    if (isDouble) {
      return (
        (wBnbBalance ? Number(wBnbBalance.toExact()) : 0) + (bnbBalance ? Number(bnbBalance.toExact()) : 0)
      ).toFixed(5)
    }
    return balance.toSignificant()
  }, [balance, isDouble, wBnbBalance, bnbBalance])

  const percents = useMemo(
    () => [
      {
        label: '10%',
        onClickHandler: () => handleInput(maxAmount?.divide('100')?.multiply(10)?.toExact() ?? ''),
      },
      {
        label: '25%',
        onClickHandler: () => handleInput(maxAmount?.divide('100')?.multiply(25)?.toExact() ?? ''),
      },
      {
        label: '50%',
        onClickHandler: () => handleInput(maxAmount?.divide('100')?.multiply(50)?.toExact() ?? ''),
      },
      {
        label: 'Max',
        onClickHandler: () => handleInput(maxAmount?.divide('100')?.multiply(100)?.toExact() ?? ''),
      },
    ],
    [maxAmount, handleInput],
  )

  return (
    <div className='w-full'>
      {locked ? (
        <div className='flex flex-col items-center gap-3 self-stretch rounded-xl border border-neutral-700 p-4'>
          <Highlight>
            <LockIcon className='h-4 w-4' />
          </Highlight>
          <Paragraph>Price is outside specified price range.</Paragraph>
          <Paragraph>Single-asset deposit only.</Paragraph>
        </div>
      ) : (
        <div className='flex flex-col gap-2'>
          <div className='flex items-center justify-between'>
            <p className='font-medium text-white'>{title}</p>
            <Tabs data={percents} />
          </div>
          <div className='flex flex-col gap-3 self-stretch rounded-xl border border-neutral-700 p-4'>
            <div className='flex items-center justify-between gap-2'>
              <input
                type='number'
                className='w-full border-0 bg-transparent p-0 text-xl text-neutral-50 placeholder-neutral-400'
                placeholder='0.0'
                value={value}
                disabled={locked}
                onChange={e => {
                  handleInput(Number(e.target.value) < 0 ? '' : e.target.value)
                }}
                min={0}
                lang='en'
              />
              <div
                className={cn(
                  'inline-flex items-center justify-center gap-2',
                  'rounded-full bg-neutral-600 text-sm text-neutral-200',
                  'py-1.5 pl-1.5 pr-2',
                )}
              >
                {isDouble ? (
                  <IconGroup
                    className='-space-x-2'
                    classNames={{
                      image: 'outline-2 w-6 h-6',
                    }}
                    logo1='https://cdn.thena.fi/assets/BSC.png'
                    logo2='https://cdn.thena.fi/assets/BNB.png'
                  />
                ) : (
                  <CircleImage alt='' className='h-6 w-6' src={logoURI} />
                )}
                <span className='text-nowrap'>{isDouble ? 'BNB + WBNB' : currency.symbol}</span>
              </div>
            </div>
            <div className='flex items-center justify-between gap-2'>
              <TextSubHeading>${formatAmount(value * price)}</TextSubHeading>
              <TextSubHeading>Balance: {balanceString}</TextSubHeading>
            </div>
          </div>
          {/* {errorMsg && (
            <Alert>
              <InfoIcon className='h-4 w-4 stroke-error-600' />
              <p>{errorMsg}</p>
            </Alert>
          )} */}
        </div>
      )}
    </div>
  )
}
