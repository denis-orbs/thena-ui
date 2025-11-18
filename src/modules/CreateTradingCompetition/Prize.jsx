import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'

import { useTC } from '@/app/arena/TCContext'
import { PrimaryButton } from '@/components/buttons/Button'
import Input from '@/components/input'
import LabelTooltip from '@/components/label/LabelTooltip'
import Toggle from '@/components/toggle'
import { TextSubHeading } from '@/components/typography'
import { MAX_ASSETS_PRIZE_TOKEN, TC_MARKET_TYPES } from '@/constant/arena'
import { formatAmount, ordinals } from '@/utils/utils'

import CustomMultipleTokenModal from '../TokenModal/CustomMultipleTokenModal'

const validNumber = val => (val === '' ? 0 : Number(val))

function Prize({ data, setData, isEntryFee, setIsEntryFee }) {
  const t = useTranslations()
  const [isPrizeOpen, setIsPrizeOpen] = useState(false)
  const { prizeTokens } = useTC()
  const { placements, weights } = data.prize

  const isSpotType = useMemo(() => data.market === TC_MARKET_TYPES.SPOT, [data.market])

  const total = useMemo(() => weights.reduce((sum, cur) => sum + validNumber(cur), 0), [weights])

  const assetsByMarket = useMemo(() => {
    if (isSpotType) {
      return data.competitionRules.tradingTokens
    }
    return prizeTokens
  }, [data.competitionRules.tradingTokens, isSpotType, prizeTokens])

  useEffect(() => {
    if (weights.length === placements) return
    const fixedArr = []
    for (let i = 0; i < placements; i++) {
      if (i < weights.length) fixedArr.push(weights[i])
      else fixedArr.push(0)
    }
    setData({
      ...data,
      prize: {
        ...data.prize,
        weights: fixedArr,
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placements, weights])

  // useEffect(() => {
  //   setData({
  //     ...data,
  //     entryFee: new Array(data.prize.token.length).fill(''),
  //   })
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [data.prize.token])

  return (
    <>
      <p className='font-figtree w-full text-xl leading-6 font-semibold text-white md:text-[22px] md:leading-7'>
        {t('Prizes')}
      </p>
      <div className='mt-4'>
        <div className='w-full'>
          <LabelTooltip id='prizesToken' label='Prizes Token' showInfoIcon tooltip='Prize Token Tooltip' required />
          <div
            className='relative flex cursor-pointer items-center'
            onClick={() => {
              setIsPrizeOpen(true)
            }}
          >
            <div className='w-full rounded-lg border border-neutral-700 bg-neutral-700 py-3.5 pr-8 pl-4 text-neutral-50 placeholder-neutral-400 transition-all duration-150 ease-out focus:border-neutral-500'>
              {data.prize.token.length} {t('Selected')}
            </div>
            <div className='absolute top-0 right-3 bottom-0 my-auto h-5 w-5'>
              <Image src='/svgs/chevron-down.svg' alt='down icon' width={20} height={20} />
            </div>
          </div>
        </div>
        <TextSubHeading className='mt-2 block'>Note: {t('Prize Token Note')}</TextSubHeading>
      </div>
      <div>
        <div className='mt-4 grid gap-x-[26px] gap-y-4 md:grid-cols-2'>
          <div className='flex:col flex h-[50px] items-center'>
            <Toggle
              checked={isEntryFee}
              toggleId='starting'
              onChange={() => {
                setData({
                  ...data,
                  entryFee: new Array(data.prize.token.length).fill(''),
                })
                setIsEntryFee(!isEntryFee)
              }}
            />
            <LabelTooltip id='entryFee' label='Entry Fee' tooltip='Entry Fee Tooltip' showInfoIcon className='mb-0' />
          </div>
          {isEntryFee && data.prize.token.length === 1 && (
            <Input
              value={data.entryFee[0]}
              type='number'
              min={0}
              TrailingButton={
                <div className='absolute right-4 flex items-center gap-1.5'>
                  <TextSubHeading>${formatAmount(data.entryFee[0] * data.prize.token[0].price)}</TextSubHeading>
                  <Image alt='' src={data.prize.token[0].logoURI} width={20} height={20} />
                  <span className='font-figtree text-lg leading-[22px] text-white'>{data.prize.token[0].symbol}</span>
                </div>
              }
              onChange={e => {
                const entryFee = [...data.entryFee]
                entryFee.splice(0, 1, e.target.value)
                setData({
                  ...data,
                  entryFee,
                })
              }}
            />
          )}
        </div>
        <div className='mt-4 grid gap-x-[26px] gap-y-4 md:grid-cols-2'>
          {isEntryFee &&
            data.prize.token.length > 1 &&
            data.prize.token.map((token, index) => (
              <div key={index}>
                <Input
                  value={data.entryFee[index]}
                  type='number'
                  min={0}
                  TrailingButton={
                    <div className='absolute right-4 flex items-center gap-1.5'>
                      <TextSubHeading>${formatAmount(data.entryFee[index] * token.price)}</TextSubHeading>
                      <Image alt='' src={token.logoURI} width={20} height={20} />
                      <span className='font-figtree text-lg leading-[22px] text-white'>{token.symbol}</span>
                    </div>
                  }
                  onChange={e => {
                    const entryFee = [...data.entryFee]
                    entryFee.splice(index, 1, e.target.value)
                    setData({
                      ...data,
                      entryFee,
                    })
                  }}
                />
              </div>
            ))}
        </div>
      </div>
      <div className='mt-4'>
        <LabelTooltip
          id='prizeDistribution'
          label='Prize Distribution'
          tooltip='Prize Distribution Tooltip'
          showInfoIcon
          required
        />
        <div className='mt-3 flex w-full items-center gap-6 md:mt-4 md:gap-9'>
          <span className='text-xl leading-6 font-semibold whitespace-nowrap text-[#E9E9F2] md:text-[22px] md:leading-7'>
            {total} %
          </span>
          <div className='h-2 w-full overflow-hidden rounded-full bg-[#272845]'>
            <div
              className='gradient-bg h-2 rounded-full transition-all duration-300 ease-in-out'
              style={{ width: `${total}%` }}
            />
          </div>
        </div>
        <TextSubHeading className='mt-2 block'>Note: {t('Prize Distribution Note')}</TextSubHeading>
      </div>
      <div className='mt-4 grid w-full gap-x-[26px] gap-y-4 md:mt-[30px] md:grid-cols-2'>
        {weights.map((item, idx) => (
          <div key={idx} className='w-full'>
            <LabelTooltip label={idx === 0 ? 'Host (25% Max)' : `${idx + ordinals(idx)} Place`} translate={false} />
            <Input
              type='number'
              value={item > 0 ? item : ''}
              onChange={e => {
                const val = validNumber(e.target.value)
                const temp = [...weights]
                if (val > 0) {
                  const maxValue = 100 - total + validNumber(weights[idx])
                  const MAX =
                    idx > 1 ? Math.min(...weights.slice(1, idx).map(ele => validNumber(ele))) : idx === 1 ? 100 : 25
                  temp[idx] = Math.min(val, maxValue, MAX)
                } else {
                  temp[idx] = 0
                }
                setData({
                  ...data,
                  prize: {
                    ...data.prize,
                    weights: temp,
                  },
                })
              }}
              min={0}
              TrailingIcon='%'
            />
          </div>
        ))}
      </div>
      <div className='mt-4 flex items-center justify-center gap-3 md:mt-6'>
        <PrimaryButton
          onClick={() => {
            if (placements > 2) setData({ ...data, prize: { ...data.prize, placements: placements - 1 } })
          }}
          disabled={placements <= 2}
          className={`bg-red-500 p-2 hover:bg-red-500 ${placements <= 2 ? 'bg-red-800 hover:bg-red-800' : ''}`}
        >
          <Image src='/svgs/minus-v2.svg' alt='' width={20} height={20} />
        </PrimaryButton>
        <PrimaryButton
          onClick={() => {
            if (placements < 100) setData({ ...data, prize: { ...data.prize, placements: placements + 1 } })
          }}
          className={`bg-green-600 p-2 hover:bg-green-600 ${total >= 100 ? 'bg-green-800 hover:bg-green-800' : ''}`}
          disabled={total >= 100 || weights.length >= 100}
        >
          <Image src='/svgs/plus-v2.svg' alt='' width={20} height={20} />
        </PrimaryButton>
      </div>

      <CustomMultipleTokenModal
        popup={isPrizeOpen}
        setPopup={setIsPrizeOpen}
        selectedAssets={data.prize.token}
        setSelectedAssets={val => {
          setData({
            ...data,
            entryFee: new Array(val.length).fill(''),
            prize: {
              ...data.prize,
              token: val,
            },
          })
        }}
        assets={assetsByMarket}
        maxAssets={MAX_ASSETS_PRIZE_TOKEN}
      />
    </>
  )
}

export default Prize
