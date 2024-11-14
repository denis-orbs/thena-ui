import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { TextButton } from '@/components/buttons/Button'
import FusionAdd from '@/components/common/AddLiquidity/FusionAdd'
import { EnterAmounts } from '@/components/common/AddLiquidity/FusionAdd/containers/EnterAmounts'
import ManualAdd from '@/components/common/AddLiquidity/FusionAdd/ManualAdd'
import IconGroup from '@/components/icongroup'
import { Paragraph, TextHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { useCurrency } from '@/hooks/fusion/Tokens'
import { formatAmount, getPoolType, unwrappedSymbol } from '@/lib/utils'
import { Bound } from '@/state/fusion/actions'
import { useV3DerivedMintInfo } from '@/state/fusion/hooks'
import { ArrowLeftIcon, CheckCircleIcon, DownloadSuccessIcon, PercentIcon, RightInIcon, RightOutIcon } from '@/svgs'

const feeAmount = 3000
export default function Step3({ pool, isAutomatic, isAdd, setCurrentStep, strategy }) {
  const t = useTranslations()
  const assets = useAssets()
  const [firstAsset, secondAsset] = useMemo(
    () => [
      assets.find(item => item.address.toLowerCase() === pool?.token0?.address.toLowerCase()),
      assets.find(item => item.address.toLowerCase() === pool?.token1?.address.toLowerCase()),
    ],
    [assets, pool],
  )
  const currencyA = useCurrency(firstAsset ? firstAsset.address : undefined)
  const currencyB = useCurrency(secondAsset ? secondAsset.address : undefined)

  const baseCurrency = currencyA
  const quoteCurrency = currencyB
  const mintInfo = useV3DerivedMintInfo(
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    feeAmount,
    baseCurrency ?? undefined,
    undefined,
  )
  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = useMemo(() => mintInfo.ticks, [mintInfo])
  return (
    <div className='mt-10 flex flex-col gap-6 lg:flex-row lg:gap-8'>
      <Box className='flex w-full flex-col lg:w-[540px]'>
        <div className='mb-4 h-11 w-fit'>
          <TextButton
            className='font-archia text-3xl text-neutral-50'
            LeadingIcon={ArrowLeftIcon}
            onClick={() => setCurrentStep(1)}
          >
            {t('Add Liquidity')}
          </TextButton>
        </div>
        <div className='mb-6 flex flex-row justify-between rounded-lg bg-neutral-800 p-4'>
          <div className='flex items-center gap-2'>
            <IconGroup
              className='-space-x-3'
              classNames={{
                image: 'outline-[2.6px] w-7 h-7',
              }}
              logo1={pool?.token0?.logoURI || UNKNOWN_LOGO}
              logo2={pool?.token1?.logoURI || UNKNOWN_LOGO}
            />
            {pool.type !== 'weighted' ? <TextHeading>{pool.symbol}</TextHeading> : <></>}
          </div>
          <NeutralBadge>{getPoolType(pool.type)}</NeutralBadge>
        </div>
        {isAutomatic ? (
          <FusionAdd strategy={isAdd ? pool : strategy} isAdd={isAdd} />
        ) : (
          <div className='space-y-6'>
            <EnterAmounts currencyA={baseCurrency} currencyB={quoteCurrency} mintInfo={mintInfo} />
            <div className='flex flex-col gap-4'>
              <TextHeading className='text-lg'>{t('Reserve Info')}</TextHeading>
              <div className='flex flex-col gap-3'>
                <div className='flex items-center justify-between'>
                  <Paragraph className='font-medium'>
                    {unwrappedSymbol(currencyA)} {t('Amount')}
                  </Paragraph>
                  <Paragraph>{formatAmount(currencyA.reserve)}</Paragraph>
                </div>
                <div className='flex items-center justify-between'>
                  <Paragraph className='font-medium'>
                    {unwrappedSymbol(currencyB)} {t('Amount')}
                  </Paragraph>
                  <Paragraph>{formatAmount(currencyB.reserve)}</Paragraph>
                </div>
              </div>
            </div>
            <div className='flex flex-col gap-4 border-t border-neutral-700 pt-4'>
              <TextHeading className='text-lg'>{t('My Info')}</TextHeading>
              <div className='flex flex-col gap-3'>
                <div className='flex items-center justify-between'>
                  <Paragraph className='font-medium'>{t('Pooled Liquidity')}</Paragraph>
                  <Paragraph>{formatAmount(pool?.account?.totalLp)} LP</Paragraph>
                </div>
                <div className='flex items-center justify-between'>
                  <Paragraph className='font-medium'>{t('Staked Liquidity')}</Paragraph>
                  <Paragraph>{formatAmount(pool?.account?.gaugeBalance)} LP</Paragraph>
                </div>
              </div>
            </div>
            <ManualAdd baseCurrency={baseCurrency} quoteCurrency={quoteCurrency} mintInfo={mintInfo} />
          </div>
        )}
      </Box>
      <div className='lg:w-[496px]'>
        <Box className='flex flex-col gap-4'>
          <TextHeading className='font-archia text-2xl font-semibold'>{t('New Deposit')}</TextHeading>
          <p>{t('New Deposit description')}</p>
          <div className='flex flex-col gap-6'>
            <div className='flex flex-row items-center gap-2'>
              <CheckCircleIcon className='h-5 w-5 stroke-success-600' />
              <div className='flex flex-col'>
                <div className='flex flex-row gap-1'>
                  <span>{t('Pool price tick at', { value: Number(pool?.globalState?.tick || 0) })}</span>
                </div>
              </div>
            </div>
            <div className='flex flex-row items-center gap-2'>
              <RightOutIcon className='h-5 w-5 stroke-success-600' />
              <div className='flex flex-col'>
                <div className='flex flex-row gap-1'>
                  <span>{t('Low tick at', { value: tickLower })}</span>
                </div>
              </div>
            </div>
            <div className='flex flex-row items-center gap-2'>
              <RightInIcon className='h-5 w-5 stroke-success-600' />
              <div className='flex flex-col'>
                <div className='flex flex-row gap-1'>
                  <span>{t('High tick at', { value: tickUpper })}</span>
                </div>
              </div>
            </div>
            <div className='flex flex-row items-center gap-2'>
              <DownloadSuccessIcon className='h-5 w-5 stroke-success-600' />
              <div className='flex flex-col'>
                <div className='flex flex-row gap-1'>
                  <span>{t('Quote for deposit received')}</span>
                  <Link href='/'>{t('Refresh')}</Link>
                </div>
              </div>
            </div>
            <div className='flex flex-row items-center gap-2'>
              <PercentIcon className='h-5 w-5 stroke-success-600' />
              <div className='flex flex-row gap-1'>
                <span>{t('slippage applied', { percent: '1.0' })}</span>
                <Link href='/'>{t('Adjust')}</Link>
              </div>
            </div>
          </div>
        </Box>
      </div>
    </div>
  )
}
