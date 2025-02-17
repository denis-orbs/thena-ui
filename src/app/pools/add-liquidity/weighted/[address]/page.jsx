'use client'

import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'

import MenuTab from '@/app/arena/MenuTab'
import Loading from '@/app/loading'
import Box from '@/components/box'
import { PrimaryButton } from '@/components/buttons/Button'
import { NewTextHeading, Paragraph, TextHeading } from '@/components/typography'
import { DEPOSIT_TYPE } from '@/constant'
import { usePairs } from '@/context/pairsContext'
import { useTokenUSDValue } from '@/hooks/usePrices'
import { formatAmount, roundIfMoreThanDecimals, unwrappedSymbol } from '@/lib/utils'
import PieChart from '@/modules/WeightedPool/PieChart'
import WeightedPoolLogo from '@/modules/WeightedPool/WeightedPoolLogo'

import { PoolInfo } from '../../ClPool'
import InputTokenMemo from '../../InputTokenMemo'

function AddLiquidityWeightedPoolPage({ params }) {
  const { address } = params
  const { weightedPools, isLoading } = usePairs()
  const t = useTranslations()
  const { getValueTokenAmountToUSD } = useTokenUSDValue()
  const [depositType, setDepositType] = useState(DEPOSIT_TYPE.SINGLE)

  const toggleDepositType = useMemo(
    () => [
      {
        title: t('Pool Token Deposit '),
        isActive: depositType === DEPOSIT_TYPE.ALL,
        isLink: false,
        onClick: () => setDepositType(DEPOSIT_TYPE.ALL),
      },
      {
        title: t('Single Token Deposit'),
        isActive: depositType === DEPOSIT_TYPE.SINGLE,
        isLink: false,
        onClick: () => setDepositType(DEPOSIT_TYPE.SINGLE),
      },
    ],
    [depositType, t],
  )

  const poolSelected = useMemo(
    () => (weightedPools || []).find(pool => pool.address === address),
    [address, weightedPools],
  )

  const [tokensData, setTokensData] = useState([...(poolSelected?.tokens || [])])

  const handleAmountChange = useCallback(
    (value, asset) => {
      setTokensData(prev => {
        const updatedTokens = [...prev]
        const changedToken = updatedTokens.find(token => token.address?.toLowerCase() === asset?.address?.toLowerCase())

        if (changedToken) {
          changedToken.amount = roundIfMoreThanDecimals(value, changedToken?.decimals)
          const currentTokenUSDValue = getValueTokenAmountToUSD(changedToken?.address, changedToken?.amount)

          updatedTokens.forEach(item => {
            if (item?.address?.toLowerCase() !== asset?.address?.toLowerCase()) {
              const otherTokenUSDValue = (currentTokenUSDValue / (changedToken.weight / 100)) * (item.weight / 100)
              item.amount = roundIfMoreThanDecimals(otherTokenUSDValue / item.price, item.decimals).toString()
            }
          })
        }

        return updatedTokens
      })
    },
    [getValueTokenAmountToUSD],
  )

  if (isLoading) return <Loading />
  return (
    <div className='space-y-8'>
      <div className='items-center space-y-2'>
        <div className='flex items-center gap-8'>
          <WeightedPoolLogo height={60} width={60} tokens={poolSelected?.tokens || []} />
          <NewTextHeading>{poolSelected?.symbol || 'UNKNOWN'}</NewTextHeading>
        </div>
        <TextHeading>{t('Weighted')}</TextHeading>
      </div>
      <div className='flex gap-4'>
        <div className='flex-[6] space-y-8'>
          {/* TODO: mock data */}
          <Box className='ml-auto flex flex-row gap-10'>
            <div className='flex flex-col gap-3'>
              <TextHeading className='font-archia text-3xl font-semibold text-gradient-primary-start'>
                {formatAmount(16.61)} %
              </TextHeading>
              <Paragraph className='text-neutral-500'>{t('Estimated APR')}</Paragraph>
            </div>
            <div className='flex flex-col gap-3'>
              <TextHeading className='font-archia text-3xl font-semibold text-gradient-primary-start'>
                ${formatAmount(15373984)}
              </TextHeading>
              <Paragraph className='text-neutral-500'>{t('(24H) Volume')}</Paragraph>
            </div>

            <div className='flex flex-col gap-3'>
              <TextHeading className='font-archia text-3xl font-semibold text-gradient-primary-start'>
                ${formatAmount(5373)}
              </TextHeading>
              <Paragraph className='text-neutral-500'>{t('(24H) Fees')}</Paragraph>
            </div>
            <div className='flex flex-col gap-3'>
              <TextHeading className='font-archia text-3xl font-semibold text-gradient-primary-start'>
                ${formatAmount(93473141)}
              </TextHeading>
              <Paragraph className='text-neutral-500'>{t('TVL')}</Paragraph>
            </div>
          </Box>
          <MenuTab className='grid w-full grid-cols-2' menuData={toggleDepositType} />
          <div>
            {depositType === DEPOSIT_TYPE.ALL && (
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {depositType === DEPOSIT_TYPE.ALL &&
                  (tokensData || []).map((token, idx) => (
                    <InputTokenMemo
                      key={token?.address}
                      token={token}
                      autoFocus={idx === 0}
                      amount={token.amountDeposit}
                      onAmountChange={value => handleAmountChange(value, token)}
                      alowDouble
                      weight={token.weight}
                    />
                  ))}
              </div>
            )}
          </div>
          <PrimaryButton className='w-full'>{t('Deposit')}</PrimaryButton>
        </div>
        <div className='flex-[4]'>
          <PoolInfo pair={poolSelected} />
          <PieChart tokens={poolSelected?.tokens || []} />
          <div className='mt-5 flex flex-col gap-4'>
            <TextHeading className='text-lg'>{t('Reserve Info')}</TextHeading>
            <div className='flex flex-col gap-3'>
              {(poolSelected.tokens || []).map(token => (
                <div className='flex items-center justify-between'>
                  <Paragraph className='font-medium'>
                    {unwrappedSymbol(token)} {t('Amount')}
                  </Paragraph>
                  <Paragraph>{formatAmount(token.reserve)}</Paragraph>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddLiquidityWeightedPoolPage
