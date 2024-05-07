import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import Input from '@/components/input'
import LabelTooltip from '@/components/label/LabelTooltip'
import Toggle from '@/components/toggle'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { formatAmount, ordinals } from '@/lib/utils'

import CustomTokenModal from '../TokenModal/CustomTokenModal'

const validNumber = val => (val === '' ? 0 : Number(val))

function Prize({ data, setData, isEntryFee, setIsEntryFee }) {
  const t = useTranslations()

  const [isPrizeOpen, setIsPrizeOpen] = useState(false)
  const { placements, weights } = data.prize

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
          />
          <div className='relative flex cursor-pointer items-center' onClick={() => setIsPrizeOpen(true)}>
            <div
              className='w-full rounded-lg border border-neutral-700 bg-neutral-700 py-3.5 pl-4 pr-8 text-neutral-50
           placeholder-neutral-400 transition-all duration-150 ease-out focus:border-neutral-500'
            >
              {data.prize.token ? (
                <div className='flex items-center space-x-1.5'>
                  <CircleImage src={data.prize.token.logoURI} width={20} height={20} alt='thena token' />
                  <TextHeading>{data.prize.token.symbol}</TextHeading>
                </div>
              ) : (
                'Select'
              )}
            </div>
            <div className='absolute bottom-0 right-3 top-0 my-auto h-5 w-5'>
              <Image src='/svgs/chevron-down.svg' alt='down icon' width={20} height={20} />
            </div>
          </div>
        </div>
        <div className='w-full'>
          <div className='flex items-center justify-between text-base leading-5'>
            <LabelTooltip
              id='hostContribution'
              label='Host Contribution'
              showInfoIcon
              tooltip='If you would like to contribute anything towards the prize pool yourself, you can do that here. Everything you put up will go towards the prize pool.'
            />
            <div className='mb-2 text-white'>
              {t('Balance')}: {formatAmount(data.prize.token?.balance)}
            </div>
          </div>
          <Input
            value={data.prize.totalPrize}
            type='number'
            TrailingButton={
              data.prize.token ? (
                <div className='absolute right-4 flex items-center space-x-1.5'>
                  <TextSubHeading>${formatAmount(data.prize.totalPrize * data.prize.token.price)}</TextSubHeading>
                  <Image alt='' src={data.prize.token.logoURI} width={20} height={20} />
                  <span className='font-figtree text-lg leading-[22px] text-white'>{data.prize.token.symbol}</span>
                </div>
              ) : undefined
            }
            onChange={e => {
              setData({
                ...data,
                prize: {
                  ...data.prize,
                  totalPrize: e.target.value,
                },
              })
            }}
          />
        </div>
      </div>
      <div className='mt-4 w-full items-center space-y-4 md:flex md:space-x-6 md:space-y-0'>
        <div className='w-full'>
          <div className='flex:col flex h-[50px] w-full items-center'>
            <Toggle
              checked={isEntryFee}
              toggleId='starting'
              onChange={() => {
                if (isEntryFee) {
                  setData({
                    ...data,
                    entryFee: '',
                  })
                }
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
        </div>
        <div className='w-full'>
          {isEntryFee && (
            <Input
              value={data.entryFee}
              type='number'
              min={0}
              TrailingButton={
                data.prize.token ? (
                  <div className='absolute right-4 flex items-center space-x-1.5'>
                    <TextSubHeading>${formatAmount(data.entryFee * data.prize.token.price)}</TextSubHeading>
                    <Image alt='' src={data.prize.token.logoURI} width={20} height={20} />
                    <span className='font-figtree text-lg leading-[22px] text-white'>{data.prize.token.symbol}</span>
                  </div>
                ) : undefined
              }
              onChange={e => {
                setData({
                  ...data,
                  entryFee: e.target.value,
                })
              }}
            />
          )}
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
          className='bg-red-600 p-[0.5rem] hover:bg-red-600'
        >
          <Image src='/svgs/minus-v2.svg' alt='' width={20} height={20} />
        </PrimaryButton>
        <PrimaryButton
          onClick={() => {
            if (placements < 100) setData({ ...data, prize: { ...data.prize, placements: placements + 1 } })
          }}
          className='bg-green-600 p-[0.5rem] hover:bg-green-600'
          disabled={total >= 100}
        >
          <Image src='/svgs/plus-v2.svg' alt='' width={20} height={20} />
        </PrimaryButton>
      </div>
      {/* Select for winning token */}
      <CustomTokenModal
        popup={isPrizeOpen}
        setPopup={setIsPrizeOpen}
        setSelectedAsset={val => {
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
