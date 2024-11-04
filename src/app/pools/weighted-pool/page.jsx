'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import { GreenBadge, PrimaryBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, OutlinedButton, PrimaryButton, TextButton } from '@/components/buttons/Button'
import { OutlineIconButton } from '@/components/buttons/IconButton'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { useTokenUSDValue } from '@/hooks/usePrices'
import { cn, formatAmount } from '@/lib/utils'
import { TokenAndInitialSeedItem } from '@/modules/WeightedPool/Preview'
import { AnalyticsIcon, ArrowLeftIcon, ExternalIcon, InfoCirCleDisableIcon } from '@/svgs'

function TokenAndWeight({ token, allocate, size = 'medium' }) {
  return (
    <div className='flex items-center gap-[6px]'>
      <Image width={size === 'big' ? 48 : 32} height={size === 'big' ? 48 : 32} src={token?.logoURI} alt='token logo' />
      <TextHeading className={cn('font-semibold', size === 'big' ? 'text-4xl' : '')}>{token?.symbol}</TextHeading>
      <Paragraph className={cn('font-archia text-[26px]', size === 'big' ? 'text-[26px]' : 'text-sm')}>
        {allocate}%
      </Paragraph>
    </div>
  )
}

const weightedPool = {
  pairs: [
    {
      token: {
        address: 'BNB',
        name: 'Binance Coin',
        symbol: 'BNB',
        decimals: 18,
        logoURI: 'https://cdn.thena.fi/assets/WBNB.png',
        price: 602.1,
        chainId: 56,
        balance: '0.030746349775499454',
      },
      lock: false,
      allocate: 50,
    },
    {
      token: {
        address: 'BNB',
        name: 'THE',
        symbol: 'THE',
        decimals: 18,
        logoURI: 'https://cdn.thena.fi/assets/THE.png',
        price: 602.1,
        chainId: 56,
        balance: '0.030746349775499454',
      },
      lock: false,
      allocate: 50,
    },
  ],
}

function PositionStaked({ data }) {
  const { pairs } = data
  const t = useTranslations()
  return (
    <Box>
      <div className='mb-6 flex flex-row items-center justify-between'>
        <div className='flex flex-row gap-4'>
          {pairs.map(item => (
            <TokenAndWeight token={item.token} allocate={item.allocate} tokenSize={32} />
          ))}
        </div>
        <GreenBadge>{t('Staked')}</GreenBadge>
      </div>
      <div className='flex flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>{t('APR')}</Paragraph>
          <TextHeading>{formatAmount(20)}%</TextHeading>
        </div>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>{t('Deposit Value in USD')}</Paragraph>
          <TextHeading>${formatAmount(123.45)}</TextHeading>
        </div>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>THE {t('Deposit')}</Paragraph>
          <div className='flex gap-1'>
            <TextHeading>{`${formatAmount(999)}`}</TextHeading>
            <TextSubHeading>{`(${formatAmount(50)}%)`}</TextSubHeading>
          </div>
        </div>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>BNB {t('Deposit')}</Paragraph>
          <div className='flex gap-1'>
            <TextHeading>{`${formatAmount(1)}`}</TextHeading>
            <TextSubHeading>({formatAmount(50)}%)</TextSubHeading>
          </div>
        </div>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>{t('Net Return')}</Paragraph>
          <div className='flex items-center gap-1'>
            <TextHeading>${formatAmount(291)}</TextHeading>
          </div>
        </div>
      </div>
      <div className='mt-6 grid grid-cols-3 gap-3'>
        <TextButton>{t('UnStake')}</TextButton>
        <OutlinedButton>{t('Harvest')}</OutlinedButton>
        <EmphasisButton>{t('Manage')}</EmphasisButton>
      </div>
    </Box>
  )
}

function PositionNotStaked({ data }) {
  const t = useTranslations()
  const { pairs } = data
  return (
    <Box>
      <div className='mb-6 flex flex-row items-center justify-between'>
        <div className='flex gap-6'>
          {pairs.map(item => (
            <TokenAndWeight token={item.token} allocate={item.allocate} size='medium' />
          ))}
        </div>
        <PrimaryBadge>{t('Not Staked')}</PrimaryBadge>
      </div>
      <div className='flex flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>{t('APR')}</Paragraph>
          <TextHeading>{formatAmount(20)}%</TextHeading>
        </div>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>{t('Deposit Value in USD')}</Paragraph>
          <TextHeading>${formatAmount(123.45)}</TextHeading>
        </div>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>THE {t('Deposit')}</Paragraph>
          <div className='flex gap-1'>
            <TextHeading>{`${formatAmount(999)}`}</TextHeading>
            <TextSubHeading>{`(${formatAmount(50)}%)`}</TextSubHeading>
          </div>
        </div>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>BNB {t('Deposit')}</Paragraph>
          <div className='flex gap-1'>
            <TextHeading>{`${formatAmount(1)}`}</TextHeading>
            <TextSubHeading>({formatAmount(50)}%)</TextSubHeading>
          </div>
        </div>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>{t('Claimable Fees')}</Paragraph>
          <div className='flex items-center gap-1'>
            <TextHeading>${formatAmount(291)}</TextHeading>
          </div>
        </div>
      </div>
      <div className='mt-6 grid grid-cols-3 gap-3'>
        <PrimaryButton>{t('Stake')}</PrimaryButton>
        <OutlinedButton>{t('Claim')}</OutlinedButton>
        <EmphasisButton>{t('Manage')}</EmphasisButton>
      </div>
    </Box>
  )
}

export default function WeightedPoolPage() {
  const { pairs } = weightedPool
  const { getValueTokenAmountToUSD } = useTokenUSDValue()
  const total = useMemo(
    () => pairs.reduce((sum, curr) => sum + getValueTokenAmountToUSD(curr.token.address, curr.amount), 0),
    [getValueTokenAmountToUSD, pairs],
  )
  const t = useTranslations()
  return (
    <div className='flex flex-col'>
      <div className='flex flex-row justify-between'>
        <div className='h-11 w-[98px]'>
          <TextButton LeadingIcon={ArrowLeftIcon}>{t('Pools')}</TextButton>
        </div>
        <div className='hidden flex-row items-center gap-3 max-lg:flex'>
          <OutlineIconButton Icon={AnalyticsIcon} />
          <OutlineIconButton Icon={ExternalIcon} />
          <PrimaryButton>{t('Add liquidity')}</PrimaryButton>
        </div>
      </div>
      <div className='flex flex-row justify-between'>
        <div className='flex flex-row gap-4'>
          {pairs.map(item => (
            <TokenAndWeight token={item.token} allocate={item.allocate} size='big' />
          ))}
        </div>
        <div className='hidden flex-row gap-3 lg:flex'>
          <OutlineIconButton Icon={AnalyticsIcon} />
          <OutlineIconButton Icon={ExternalIcon} />
          <PrimaryButton>{t('Add liquidity')}</PrimaryButton>
        </div>
      </div>
      <div className='mt-4'>
        <div className='mb-6 flex gap-3'>
          <span className='h-7 w-fit rounded-full bg-neutral-600 px-3 py-1'>{t('Weighted')}</span>
          <span className='h-7 w-fit rounded-full bg-neutral-600 px-3 py-1'>{t('Fee')}: 0,005%</span>
        </div>
        <div className='flex flex-col lg:flex-row lg:gap-12'>
          <div className='flex flex-col gap-12 lg:w-[65%]'>
            <Box className='flex flex-row justify-between'>
              <div className='flex flex-col gap-2'>
                <TextHeading>24%</TextHeading>
                <Paragraph>APR</Paragraph>
              </div>
              <div className='flex flex-col gap-2'>
                <TextHeading>$1,060,268</TextHeading>
                <Paragraph>TVL</Paragraph>
              </div>
              <div className='flex flex-col gap-2'>
                <TextHeading>$224,969</TextHeading>
                <Paragraph>{`${t('Volume')} (${t('24h')})`}</Paragraph>
              </div>
              <div className='flex flex-col gap-2'>
                <TextHeading>$723.45</TextHeading>
                <Paragraph>{`${t('Fees')} (${t('24h')})`}</Paragraph>
              </div>
            </Box>
            <div className='flex flex-col gap-4'>
              <TextHeading className='font-archia text-3xl font-semibold'>{t('Pool Composition')}</TextHeading>
              <div className='rounded-xl bg-neutral-900 px-1 py-6 lg:p-6'>
                <table className='min-w-full rounded-lg'>
                  <thead>
                    <tr>
                      <th className='px-6 py-3 text-left text-neutral-50'>{t('Token')}</th>
                      <th className='px-6 py-3 text-right text-neutral-50'>{t('weight')}</th>
                      <th className='px-6 py-3 text-right text-neutral-50'>{t('Balance')}</th>
                      <th className='px-6 py-3 text-right text-neutral-50'>{t('USD Value')}</th>
                    </tr>
                  </thead>
                  <tbody className='space-y-3'>
                    {pairs.map(row => (
                      <tr key={row?.token?.address}>
                        <td colSpan='4' className='p-3'>
                          <div className='flex items-center space-x-2 rounded-lg bg-neutral-800 px-3 py-4 lg:px-6'>
                            <div className='flex gap-2 whitespace-nowrap text-neutral-50'>
                              <Image width={36} height={36} src={row?.token?.logoURI} alt={row?.token?.symbol} />
                            </div>
                            <div className='flex-1 whitespace-nowrap text-right text-neutral-50'>{row?.allocate}</div>
                            <div className='flex-1 whitespace-nowrap text-right text-neutral-50'>999</div>
                            <div className='flex-1 whitespace-nowrap text-right text-neutral-50'>999</div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className='flex flex-col gap-4'>
              <TextHeading className='font-archia text-3xl font-semibold'>{t('Pool Attributes')}</TextHeading>
              <Box>
                <table className='min-w-full border-separate border-spacing-y-3'>
                  <tbody>
                    <tr>
                      <td className='pr-4'>{t('Name')}:</td>
                      <td>TWP-THE1-BNB1</td>
                    </tr>
                    <tr>
                      <td className='pr-4'>{t('Symbol')}:</td>
                      <td>TWP-THE1-BNB1</td>
                    </tr>
                    <tr>
                      <td className='pr-4'>{t('Type')}:</td>
                      <td>Weighted</td>
                    </tr>
                    <tr>
                      <td className='pr-4'>{t('Swap fees')}:</td>
                      <td>0.3% (editable by governance)</td>
                    </tr>
                    <tr>
                      <td className='pr-4'>{t('Protocol version')}:</td>
                      <td>THENA V3</td>
                    </tr>
                    <tr>
                      <td className='pr-4'>{t('Pool Owner')}:</td>
                      <td className='flex items-center'>
                        <span>0x89c5...cdfb</span>
                        <Link href='https://bscscan.com/address/' target='_blank'>
                          <TextButton LeadingIcon={ExternalIcon} />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td className='pr-4'>{t('Attribute immutability')}:</td>
                      <td>Immutable except for swap fees editable by governance</td>
                    </tr>
                    <tr>
                      <td className='pr-4'>{t('Creation date')}:</td>
                      <td>Oct 31, 2024, 3 PM UTC</td>
                    </tr>
                    <tr>
                      <td className='pr-4'>{t('LP token price')}:</td>
                      <td>$225.50</td>
                    </tr>
                    <tr>
                      <td className='pr-4'>{t('Pool address')}:</td>
                      <td className='flex items-center'>
                        <span>0x89c5...cdfb</span>
                        <Link href='https://bscscan.com/address/' target='_blank'>
                          <TextButton LeadingIcon={ExternalIcon} />
                        </Link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Box>
            </div>
          </div>
          <div className='flex flex-col gap-12 lg:w-[35%]'>
            <div className='flex flex-col gap-5'>
              <TextHeading className='font-archia text-3xl font-semibold'>{t('My Positions')}</TextHeading>
              <PositionStaked data={weightedPool} />
              <PositionNotStaked data={weightedPool} />
            </div>
            <div className='flex flex-col gap-3'>
              <TextHeading className='font-archia text-3xl font-semibold'>{t('My Initial Liquidity')}</TextHeading>
              <Box className='flex flex-col gap-4'>
                <div className='flex flex-col divide-y divide-neutral-700'>
                  {pairs.map(item => (
                    <TokenAndInitialSeedItem item={item} />
                  ))}
                  <div className='flex flex-row justify-between pt-4'>
                    <TextHeading>{t('Total')}</TextHeading>
                    <TextHeading>${formatAmount(total)}</TextHeading>
                  </div>
                </div>
                <OutlinedButton className='w-full'>
                  {t('Withdraw Initial Liquidity')} <InfoCirCleDisableIcon className='h-4 w-4' />
                </OutlinedButton>
              </Box>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
