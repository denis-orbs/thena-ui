import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useRef } from 'react'
import { WBNB } from 'thena-sdk-core'

import AssetDropdown from '@/components/dropdown/AssetDropdown'
import Highlight from '@/components/highlight'
import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import NextImage from '@/components/image/NextImage'
import Tabs from '@/components/tabs'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { BNB_LOGO, BSC_LOGO, FusionRangeType } from '@/constant'
import { useCurrency } from '@/hooks/fusion/Tokens'
import { useCurrencyBalance } from '@/hooks/fusion/useCurrencyBalances'
import { useCurrencyLogo, useCurrencyPrice } from '@/hooks/fusion/useCurrencyLogo'
import { useChainSettings } from '@/state/settings/hooks'
import cn from '@/utils/classes'
import { formatAmount, fromWei } from '@/utils/utils'

/**
 * @param {Object} props
 * @param {string} props.value, ether value
 * @param {import('thena-sdk-core').CurrencyAmount} props.maxAmount, wei value
 */
export function TokenAmountCard({
  currency,
  setCurrency,
  assetsSelect,
  value,
  maxAmount,
  handleInput,
  locked = false,
  liquidityRangeType = FusionRangeType.MANUAL_RANGE,
  title,
  showPercent = true,
  showOutsideWarning = true,
  isSmall = false,
  classNames,
}) {
  const { networkId } = useChainSettings()
  const bnb = useCurrency('BNB')
  const balance = useCurrencyBalance(currency)
  const bnbBalance = useCurrencyBalance(bnb)
  const wBnbBalance = useCurrencyBalance(WBNB[networkId])
  const logoURI = useCurrencyLogo(currency)
  const price = useCurrencyPrice(currency)
  const t = useTranslations()

  const isDouble = useMemo(
    () =>
      [FusionRangeType.GAMMA_RANGE, FusionRangeType.DEFIEDGE_RANGE, FusionRangeType.ICHI_RANGE].includes(
        liquidityRangeType,
      ) &&
      networkId &&
      currency?.wrapped?.address?.toLowerCase() === WBNB[networkId].address.toLowerCase(),
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

  const inputRefer = useRef(null)
  const onfocusInput = useCallback(() => {
    if (inputRefer && inputRefer.current) {
      inputRefer.current.focus()
    }
  }, [])

  const isInvalidAmount = useMemo(() => {
    if (value === '' || value === '0') return false
    if (Number(value) === Number.isNaN || Number(value) < 0) return true
    if (maxAmount) {
      const amountBN = fromWei(maxAmount.quotient.toString())
      if (amountBN.lt(value)) return true
    }

    return false
  }, [value, maxAmount])

  return (
    <div className={cn('w-full', locked && !showOutsideWarning && 'hidden')}>
      {locked ? (
        showOutsideWarning && (
          <div className='flex flex-col items-center gap-3 self-stretch rounded-xl border border-neutral-700 p-4'>
            <Highlight>
              <NextImage src='/svgs/lock.svg' alt='lock icon' className='size-4' />
            </Highlight>
            <Paragraph>{t('The market price is outside')}</Paragraph>
            <Paragraph>{t('Single-asset deposit only')}</Paragraph>
          </div>
        )
      ) : (
        <div className='flex flex-col'>
          <div className='flex items-center justify-between'>
            <p className='font-medium text-white'>{title}</p>
            {showPercent && <Tabs data={percents} />}
          </div>

          <div
            className={cn(
              'flex flex-col gap-3 self-stretch rounded-xl p-4',
              'shadow-[inset_0_0_0_1px_theme(colors.neutral.700)] hover:bg-neutral-900',
              'focus-within:shadow-[inset_0_0_0_1px_theme(colors.neutral.500)] focus-within:hover:bg-transparent!',
              isSmall && 'box-sizing:border-box gap-1! px-3! py-2!',
              isInvalidAmount &&
                'shadow-[inset_0_0_0_1px_theme(colors.error.600)] focus-within:shadow-[inset_0_0_0_1px_theme(colors.error.500)]',
              classNames?.inputWrapper,
            )}
            onClick={onfocusInput}
          >
            <div className='flex items-center justify-between gap-2'>
              <input
                ref={inputRefer}
                type='number'
                className={cn(
                  'w-full truncate border-0 bg-transparent p-0 text-xl text-neutral-50 placeholder-neutral-400',
                  classNames?.input,
                )}
                placeholder='0.0'
                value={value}
                disabled={locked}
                onChange={e => {
                  let { value: inputValue } = e.target
                  if (inputValue === '') {
                    handleInput('')
                    return
                  }
                  if (!isNaN(Number(inputValue))) {
                    inputValue = inputValue.replace(/^0+(?=\d)/, '')
                  }
                  handleInput(inputValue)
                }}
                min={0}
                lang='en'
              />
              {setCurrency && Array.isArray(assetsSelect) ? (
                <AssetDropdown
                  className='hover-dont-change-bg hover:rounded-lg hover:bg-neutral-700 [&>#info]:rounded-lg! [&>#info]:bg-[#292929]/50!'
                  selected={currency}
                  setCurrency={setCurrency}
                  data={assetsSelect}
                />
              ) : (
                <div
                  className={cn(
                    'inline-flex items-center justify-center gap-2',
                    'rounded-lg bg-[#292929]/50 text-sm text-neutral-200',
                    'py-1.5 pr-2 pl-1.5',
                    'cursor-default',
                  )}
                >
                  {isDouble ? (
                    <IconGroup
                      className='*:not-first:-ml-2'
                      classNames={{
                        image: 'outline-2 w-6 h-6',
                      }}
                      logo1={BSC_LOGO}
                      logo2={BNB_LOGO}
                    />
                  ) : (
                    <CircleImage alt='' className='h-6 w-6' src={logoURI} />
                  )}
                  <span className='text-nowrap'>{isDouble ? 'BNB + WBNB' : currency?.symbol}</span>
                </div>
              )}
            </div>
            <div className='flex items-center justify-between gap-2'>
              <TextSubHeading className={cn('truncate text-neutral-500', isSmall && 'text-xs!')}>
                ${formatAmount(value * price)}
              </TextSubHeading>
              <TextSubHeading className={cn('flex gap-4 text-nowrap text-neutral-500', isSmall && 'text-xs!')}>
                <span>
                  {t('Balance')}: {balanceString}
                </span>
                <span
                  onClick={() => handleInput(maxAmount?.toExact())}
                  className={cn(
                    'text-primary-600 cursor-pointer',
                    maxAmount?.toExact() === '0' && 'hidden',
                    classNames?.maxBtn,
                  )}
                >
                  {t('Max')}
                </span>
              </TextSubHeading>
            </div>
          </div>
          {isInvalidAmount && (
            <TextHeading className='text-error-600 text-base font-normal'>{t('Invalid amount')}</TextHeading>
          )}
        </div>
      )}
    </div>
  )
}
