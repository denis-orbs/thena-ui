import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import Input from '@/components/input'
import LabelTooltip from '@/components/label/LabelTooltip'
import Toggle from '@/components/toggle'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { TC_MARKET_TYPES } from '@/constant'
import { useTC } from '@/context/tcContext'
import { formatAmount, ordinals } from '@/lib/utils'

import CustomMultipleTokenModal from '../TokenModal/CustomMultipleTokenModal'

const validNumber = val => (val === '' ? 0 : Number(val))

function Prize({ data, setData, isEntryFee, setIsEntryFee }) {
  const t = useTranslations()

  const [isPrizeOpen, setIsPrizeOpen] = useState(false)
  const { tradingTokens } = useTC()

  const { placements, weights } = data.prize

  const isSpotType = useMemo(() => data.market === TC_MARKET_TYPES.SPOT, [data.market])

  const USDTAsset = useMemo(
    () =>
      tradingTokens.find(
        item => item.address.toLowerCase() === '0x55d398326f99059fF775485246999027B3197955'.toLowerCase(),
      ),
    [tradingTokens],
  )
  const total = useMemo(() => weights.reduce((sum, cur) => sum + validNumber(cur), 0), [weights])

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

  return (
    <>
      <p className='font-figtree w-full text-xl font-semibold leading-6 text-white md:text-[22px] md:leading-7'>
        Prizes
      </p>
      <div className='mt-4 w-full items-center space-y-4 md:flex md:space-x-6 md:space-y-0'>
        <div className='w-full'>
          <LabelTooltip
            id='prizesToken'
            label='Prizes Token'
            showInfoIcon
            tooltip='Select the asset you would like to to pay out the prizes in.'
            required
          />
          <div
            className={`relative flex ${isSpotType ? 'cursor-pointer' : 'cursor-not-allowed'} items-center`}
            onClick={() => {
              if (isSpotType) {
                setIsPrizeOpen(true)
              }
            }}
          >
            <div
              className='w-full rounded-lg border border-neutral-700 bg-neutral-700 py-3.5 pl-4 pr-8 text-neutral-50
           placeholder-neutral-400 transition-all duration-150 ease-out focus:border-neutral-500'
            >
              {!isSpotType ? (
                <div className='flex items-center space-x-1.5'>
                  <CircleImage src={data.prize.token?.[0]?.logoURI} width={20} height={20} alt='thena token' />
                  <TextHeading>{data.prize.token?.[0]?.symbol}</TextHeading>
                </div>
              ) : (
                `${data.prize.token.length} Selected`
              )}
            </div>
            <div className='absolute bottom-0 right-3 top-0 my-auto h-5 w-5'>
              <Image src='/svgs/chevron-down.svg' alt='down icon' width={20} height={20} />
            </div>
          </div>
        </div>
        {!isSpotType && (
          <div className='w-full'>
            <div className='flex items-center justify-between text-base leading-5'>
              <LabelTooltip
                id='hostContribution'
                label='Host Contribution'
                showInfoIcon
                tooltip='You need to contribute at least a dust amount to seed the initial prize pool. You are not going to get this amount back, unless prize distribution includes the host as well, that you can set.'
                required
              />
              <div className='mb-2 text-white'>
                {t('Balance')}: {formatAmount(USDTAsset?.balance)}
              </div>
            </div>
            <Input
              value={data.prize.totalPrize[0]}
              type='number'
              placeholder='1'
              TrailingButton={
                data.prize.token?.length ? (
                  <div className='absolute right-4 flex items-center space-x-1.5'>
                    <TextSubHeading>${formatAmount(data.prize.totalPrize * data.prize.token[0].price)}</TextSubHeading>
                    <Image alt='' src={data.prize.token[0].logoURI} width={20} height={20} />
                    <span className='font-figtree text-lg leading-[22px] text-white'>{data.prize.token[0].symbol}</span>
                  </div>
                ) : undefined
              }
              onChange={e => {
                setData({
                  ...data,
                  prize: {
                    ...data.prize,
                    totalPrize: [e.target.value],
                  },
                })
              }}
            />
          </div>
        )}
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
                  entryFee: isEntryFee ? [] : new Array(data.prize.token.length).fill(''),
                })
                setIsEntryFee(!isEntryFee)
              }}
            />
            <LabelTooltip
              id='entryFee'
              label='Entry Fee'
              tooltip='If you would like to charge an entry fee from your participants, you can do that here. All entry fee will go towards the prize pool.'
              showInfoIcon
              className='mb-0'
            />
          </div>
          {isEntryFee && data.prize.token.length === 1 && (
            <Input
              value={data.entryFee[0]}
              type='number'
              min={0}
              TrailingButton={
                <div className='absolute right-4 flex items-center space-x-1.5'>
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
                    <div className='absolute right-4 flex items-center space-x-1.5'>
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
          tooltip='Here you can set the distribution for the prize pool. You can give a maximum of 25% to yourself, and you have to divide the rest of the percentages to various placements. The total prize distribution bar must equal to 100% before you can create your trading competition.'
          showInfoIcon
        />
        <div className='mt-3 flex w-full items-center space-x-6 md:mt-4 md:space-x-9'>
          <span className='whitespace-nowrap text-xl font-semibold leading-6 text-[#E9E9F2] md:text-[22px] md:leading-7'>
            {total} %
          </span>
          <div className='h-2 w-full overflow-hidden rounded-full bg-[#272845]'>
            <div
              className='gradient-bg h-2 rounded-full transition-all duration-300 ease-in-out'
              style={{ width: `${total}%` }}
            />
          </div>
        </div>
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
      <div className='mt-4 flex items-center justify-center space-x-3 md:mt-6'>
        <PrimaryButton
          onClick={() => {
            if (placements > 2) setData({ ...data, prize: { ...data.prize, placements: placements - 1 } })
          }}
          disabled={placements <= 2}
          className={`bg-red-500 p-[0.5rem] hover:bg-red-500 ${placements <= 2 ? 'bg-red-800 hover:bg-red-800' : ''}`}
        >
          <Image src='/svgs/minus-v2.svg' alt='' width={20} height={20} />
        </PrimaryButton>
        <PrimaryButton
          onClick={() => {
            if (placements < 100) setData({ ...data, prize: { ...data.prize, placements: placements + 1 } })
          }}
          className={`bg-green-600 p-[0.5rem] hover:bg-green-600 ${
            total >= 100 ? 'bg-green-800 hover:bg-green-800' : ''
          }`}
          disabled={total >= 100}
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
            prize: {
              ...data.prize,
              token: val,
            },
          })
        }}
        assets={data.competitionRules.tradingTokens}
      />
    </>
  )
}

export default Prize
