/* eslint-disable @next/next/no-img-element */

'use client'

import BigNumber from 'bignumber.js'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'

import CreateTcMultiSelect from '@/components/dropdown/CreateTcMultiselect'
import CircleImage from '@/components/image/CircleImage'
import Input from '@/components/input'
import LabelTooltip from '@/components/label/LabelTooltip'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { TC_MARKET_TYPES } from '@/constant'
import { useTC } from '@/context/tcContext'
import { formatAmount } from '@/lib/utils'

import CustomMultipleTokenModal from '../TokenModal/CustomMultipleTokenModal'
import CustomTokenModal from '../TokenModal/CustomTokenModal'

function Token({ data, setData }) {
  const [isTradeOpen, setIsTradeOpen] = useState(false)
  const [isWinningOpen, setIsWinningOpen] = useState(false)
  const { tradingTokens, isAllowedPerpetual, pairLists } = useTC()

  const t = useTranslations()

  const isSpotType = useMemo(() => data.market === TC_MARKET_TYPES.SPOT, [data.market])

  const USDTAsset = useMemo(
    () =>
      tradingTokens.find(
        item => item.address.toLowerCase() === '0x55d398326f99059fF775485246999027B3197955'.toLowerCase(),
      ),
    [tradingTokens],
  )

  const dataListPairs = useMemo(() => {
    if (pairLists && Array.isArray(pairLists)) {
      const result = pairLists.map(item => ({
        key: new BigNumber(item.symbolId).toNumber(),
        label: item.name,
      }))
      return result
    }
    return []
  }, [pairLists])

  useEffect(() => {
    const { winningToken } = data.competitionRules
    if (
      data.competitionRules.tradingTokens.length === 0 ||
      (winningToken && !data.competitionRules.tradingTokens.find(ele => ele.address === winningToken.address))
    ) {
      setData({
        ...data,
        competitionRules: {
          ...data.competitionRules,
          winningToken: null,
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.competitionRules.tradingTokens])

  useEffect(() => {
    if (!isSpotType) {
      setData({
        ...data,
        competitionRules: {
          ...data.competitionRules,
          winningToken: USDTAsset,
        },
      })
    } else if (data?.competitionRules?.winningToken) {
      if (data?.competitionRules?.winningToken.address.toLowerCase() === USDTAsset?.address.toLowerCase()) {
        if (
          data?.competitionRules?.tradingTokens.find(
            item => item.address.toLowerCase() === USDTAsset?.address.toLowerCase(),
          ) === undefined
        ) {
          setData({
            ...data,
            competitionRules: {
              ...data?.competitionRules,
              winningToken: null,
            },
          })
        }
      }
    } else {
      setData({
        ...data,
        competitionRules: {
          ...data?.competitionRules,
          winningToken: null,
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [USDTAsset, isSpotType, setData])

  return (
    <>
      <div>
        <LabelTooltip
          id='competition-type'
          label='Competition Type'
          showInfoIcon
          tooltip='Select the competition type you would like your trading competition to be in.'
          required
        />
        <div className='mt-3 flex items-center space-x-3'>
          <button
            onClick={() => {
              setData({
                ...data,
                market: TC_MARKET_TYPES.SPOT,
                prize: {
                  ...data.prize,
                  token: data.market !== TC_MARKET_TYPES.SPOT ? [] : data.prize.token,
                },
              })
            }}
            className={`px-6 py-[8.4px] uppercase text-white ${
              isSpotType ? 'bg-primary-600 hover:bg-primary-400' : 'bg-neutral-700'
            } rounded-lg`}
            type='button'
          >
            {t('Spot')}
          </button>
          <button
            className={`d px-6 py-[8.4px] uppercase text-white disabled:cursor-not-allowed disabled:text-gray-500 ${
              !isSpotType ? 'bg-primary-600 hover:bg-primary-400' : 'bg-neutral-700'
            } rounded-lg`}
            type='button'
            disabled={!isAllowedPerpetual}
            onClick={() => {
              setData({
                ...data,
                market: TC_MARKET_TYPES.PERPETUAL,
                prize: {
                  ...data.prize,
                  token: [USDTAsset],
                },
              })
            }}
          >
            {t('Perpetual')}
          </button>
        </div>
      </div>
      {isSpotType ? (
        <div className='mt-3'>
          <LabelTooltip
            id='trading-competition-tradable-tokens'
            label='Tradable Tokens Label'
            showInfoIcon
            tooltip='Here you can select whether you would like your participants to trade in any assets or with certain assets only.'
            required
          />
          <div className='relative flex cursor-pointer items-center' onClick={() => setIsTradeOpen(true)}>
            <div
              className='w-full rounded-lg border border-neutral-700 bg-neutral-700 py-3.5 pl-4 pr-8 text-neutral-50
           placeholder-neutral-400 transition-all duration-150 ease-out focus:border-neutral-500'
            >
              {data.competitionRules?.tradingTokens?.length || 0} Selected
            </div>
            <div className='absolute bottom-0 right-3 top-0 my-auto h-5 w-5'>
              <Image src='/svgs/chevron-down.svg' alt='down icon' width={20} height={20} />
            </div>
          </div>
        </div>
      ) : (
        <div className='mt-3'>
          <LabelTooltip
            id='pairs'
            label='Pairs'
            showInfoIcon={false}
            // tooltip='Here you can select whether you would like your participants to trade in any assets or with certain assets only.'
            required
          />
          <div className='flex cursor-pointer items-center'>
            <CreateTcMultiSelect
              data={dataListPairs}
              selected={data.competitionRules.pairIds}
              setSelected={val => {
                setData({
                  ...data,
                  competitionRules: {
                    ...data.competitionRules,
                    pairIds: val,
                  },
                })
              }}
            />
          </div>
        </div>
      )}

      <div className='mt-3'>
        <LabelTooltip
          id='trading-competition-winning-token'
          label='Winning Token'
          showInfoIcon
          tooltip='Select the token that you would like your participants to acquire and be counted towards the competition.'
          required
        />
        <div
          className={`relative flex ${isSpotType ? 'cursor-pointer' : 'cursor-not-allowed'} items-center`}
          onClick={() => {
            if (isSpotType) {
              setIsWinningOpen(true)
            }
          }}
        >
          <div
            className='w-full rounded-lg border border-neutral-700 bg-neutral-700 py-3.5 pl-4 pr-8 text-neutral-50
           placeholder-neutral-400 transition-all duration-150 ease-out focus:border-neutral-500'
          >
            {data.competitionRules?.winningToken ? (
              <div className='flex items-center space-x-1.5'>
                <CircleImage
                  src={data.competitionRules.winningToken.logoURI}
                  width={20}
                  height={20}
                  alt='thena token'
                />
                <TextHeading>{data.competitionRules.winningToken.symbol}</TextHeading>
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
      <div className='mt-3 items-center space-y-4 md:mt-5 md:flex md:space-x-6 md:space-y-0'>
        <div className='flex:col flex h-[50px] w-full items-center'>
          {/* <Toggle checked disabled toggleId='starting' onChange={() => {}} /> */}
          <LabelTooltip
            id='startingBalance'
            label='Total Deposit Required to Join'
            tooltip='Minimum balance for participants to join your trading competition.'
            showInfoIcon
            className='mb-0'
            required
          />
        </div>
        <div className='w-full'>
          <Input
            value={data.competitionRules.startingBalance}
            type='number'
            onChange={e => {
              setData({
                ...data,
                competitionRules: {
                  ...data.competitionRules,
                  startingBalance: e.target.value,
                },
              })
            }}
            TrailingButton={
              data.competitionRules.winningToken ? (
                <div className='absolute right-4 flex items-center space-x-1.5'>
                  <TextSubHeading>
                    ${formatAmount(data.competitionRules.startingBalance * data.competitionRules.winningToken.price)}
                  </TextSubHeading>
                  <Image alt='' src={data.competitionRules.winningToken.logoURI} width={20} height={20} />
                  <span className='font-figtree text-lg leading-[22px] text-white'>
                    {data.competitionRules.winningToken.symbol}
                  </span>
                </div>
              ) : undefined
            }
          />
        </div>
      </div>

      {/* Multi-select for trading tokens */}
      <CustomMultipleTokenModal
        popup={isTradeOpen}
        setPopup={setIsTradeOpen}
        selectedAssets={data.competitionRules.tradingTokens}
        setSelectedAssets={val => {
          setData({
            ...data,
            competitionRules: {
              ...data.competitionRules,
              tradingTokens: val,
            },
          })
        }}
        assets={tradingTokens}
      />

      {/* Select for winning token */}
      <CustomTokenModal
        popup={isWinningOpen}
        setPopup={setIsWinningOpen}
        setSelectedAsset={val => {
          setData({
            ...data,
            competitionRules: {
              ...data.competitionRules,
              winningToken: val,
            },
          })
        }}
        assets={data.competitionRules.tradingTokens}
      />
    </>
  )
}

export default Token
