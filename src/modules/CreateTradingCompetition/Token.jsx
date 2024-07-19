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
import Toggle from '@/components/toggle'
import CustomTooltip from '@/components/tooltip'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { DEPOSIT_TYPE, TC_MARKET_TYPES, WIN_TYPE } from '@/constant'
import { useTC } from '@/context/tcContext'
import { formatAmount } from '@/lib/utils'
import { InfoIcon } from '@/svgs'

import CustomMultipleTokenModal from '../TokenModal/CustomMultipleTokenModal'
import CustomTokenModal from '../TokenModal/CustomTokenModal'

function Token({ data, setData, isStartingBalance, setIsStartingBalance }) {
  const [isTradeOpen, setIsTradeOpen] = useState(false)
  const [isWinningOpen, setIsWinningOpen] = useState(false)
  const { tradingTokens, isAllowedPerpetual, pairLists } = useTC()

  const t = useTranslations()

  const depositType = useMemo(() => data.depositType, [data.depositType])
  const isSpotType = useMemo(() => data.market === TC_MARKET_TYPES.SPOT, [data.market])
  const winType = useMemo(() => data.winType, [data.winType])

  const USDTAsset = useMemo(
    () =>
      tradingTokens.find(
        item => item.address.toLowerCase() === '0x55d398326f99059fF775485246999027B3197955'.toLowerCase(),
      ),
    [tradingTokens],
  )

  const dataListPairs = useMemo(() => {
    if (pairLists?.[1] && Array.isArray(pairLists[1])) {
      const result = pairLists[1].map((item, index) => ({
        key: new BigNumber(pairLists[0][index]).toNumber(),
        label: item,
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
                  token: data.market !== TC_MARKET_TYPES.PERPETUAL ? [] : data.prize.token,
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
      {isSpotType && (
        <div className='mt-3'>
          <LabelTooltip
            id='deposit-type'
            label='Deposit Type'
            showInfoIcon
            tooltip={t('Deposit Type tooltip')}
            required
          />
          <div className='mt-3 flex items-center space-x-3'>
            <button
              onClick={() => {
                setData({
                  ...data,
                  depositType: DEPOSIT_TYPE.FREE,
                  winType: WIN_TYPE.PNL,
                })
              }}
              className={`py-[8.4px] pl-6 pr-8 uppercase text-white ${
                !depositType ? 'bg-primary-600 hover:bg-primary-400' : 'bg-neutral-700'
              } relative rounded-lg`}
              type='button'
            >
              <InfoIcon
                className={`absolute right-1 top-1 h-4 w-4 ${!depositType ? 'stroke-white' : 'stroke-neutral-400'}`}
                data-tooltip-id='deposit-type-free'
              />
              {t('Free')}
            </button>
            <CustomTooltip
              className='z-50 min-w-[136px] max-w-[320px] !bg-neutral-500 shadow-xl after:!bg-neutral-500'
              id='deposit-type-free'
              place='right'
            >
              {t('Deposit Type Free tooltip')}
            </CustomTooltip>
            <button
              className={`py-[8.4px] pl-6 uppercase text-white disabled:cursor-not-allowed disabled:text-gray-500 ${
                depositType ? 'bg-primary-600 hover:bg-primary-400' : 'bg-neutral-700'
              } relative rounded-lg pr-8`}
              type='button'
              disabled={!isAllowedPerpetual}
              onClick={() => {
                setData({
                  ...data,
                  depositType: DEPOSIT_TYPE.FIXED,
                  winType: WIN_TYPE.AMOUNT,
                })
              }}
            >
              <InfoIcon
                className={`absolute right-1 top-1 h-4 w-4 ${depositType ? 'stroke-white' : 'stroke-neutral-400'}`}
                data-tooltip-id='deposit-type-fixed'
              />
              {t('Fixed')}
            </button>
            <CustomTooltip
              className='z-50 min-w-[136px] max-w-[320px] !bg-neutral-500 shadow-xl after:!bg-neutral-500'
              id='deposit-type-fixed'
              place='right'
            >
              {t('Deposit Type Fixed tooltip')}
            </CustomTooltip>
          </div>

          <div className='my-2 flex flex-col justify-between md:flex-row'>
            <LabelTooltip
              id='balance-label'
              showInfoIcon
              label={depositType ? 'Required Deposit to Join' : 'Minimum Deposit to Join'}
              required={depositType}
              tooltip={
                depositType
                  ? 'Required deposit to participate in the competition.'
                  : 'Minimum deposit to participate in the competition.'
              }
            />
            <Input
              value={
                data.depositType === DEPOSIT_TYPE.FREE
                  ? data.competitionRules.minimumBalance
                  : data.competitionRules.startingBalance
              }
              type='number'
              className='md:w-72'
              onWheel={e => e.target.blur()}
              onChange={e => {
                if (data.depositType === DEPOSIT_TYPE.FREE) {
                  setData({
                    ...data,
                    competitionRules: {
                      ...data.competitionRules,
                      minimumBalance: e.target.value,
                    },
                  })
                } else {
                  setData({
                    ...data,
                    competitionRules: {
                      ...data.competitionRules,
                      startingBalance: e.target.value,
                    },
                  })
                }
              }}
              TrailingButton={
                data.competitionRules.winningToken ? (
                  <div className='absolute right-4 flex items-center space-x-1.5'>
                    <TextSubHeading>
                      $
                      {formatAmount(
                        depositType
                          ? data.competitionRules.startingBalance * data.competitionRules.winningToken.price
                          : data.competitionRules.minimumBalance * data.competitionRules.winningToken.price,
                      )}
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
      )}
      {!isSpotType && (
        <div className='mt-3 items-center space-y-4 md:mt-5 md:flex md:space-x-6 md:space-y-0'>
          <div className='flex:col flex h-[50px] w-full items-center'>
            <Toggle
              checked={isStartingBalance}
              toggleId='starting'
              onChange={() => {
                setIsStartingBalance(!isStartingBalance)
                setData({
                  ...data,
                  competitionRules: {
                    ...data.competitionRules,
                    startingBalance: '',
                  },
                })
              }}
            />

            <LabelTooltip
              id='startingBalance'
              label='Required Deposit to Join'
              tooltip='Required deposit to participate in the competition.'
              showInfoIcon
              className='mb-0'
              required={isStartingBalance}
            />
          </div>
          {isStartingBalance && (
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
                        $
                        {formatAmount(data.competitionRules.startingBalance * data.competitionRules.winningToken.price)}
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
          )}
        </div>
      )}
      {isSpotType && (
        <>
          <LabelTooltip id='win-type-label' label='Win Type' showInfoIcon tooltip={t('Win Type tooltip')} required />
          <div className='mt-3 flex items-center space-x-3'>
            <button
              className={`py-[8.4px] pl-6 uppercase text-white disabled:cursor-not-allowed disabled:text-gray-500 ${
                winType ? 'bg-primary-600 hover:bg-primary-400' : 'bg-neutral-700'
              } relative rounded-lg pr-8`}
              type='button'
              onClick={() => {
                setData({
                  ...data,
                  winType: WIN_TYPE.PNL,
                })
              }}
            >
              <InfoIcon
                className={`absolute right-1 top-1 h-4 w-4 ${winType ? 'stroke-white' : 'stroke-neutral-400'}`}
                data-tooltip-id='win-type-pnl'
              />
              {t('%PNL')}
            </button>
            <CustomTooltip
              className='z-50 min-w-[136px] max-w-[320px] !bg-neutral-500 shadow-xl after:!bg-neutral-500'
              id='win-type-pnl'
              place='right'
            >
              {t('Win Type PNL tooltip')}
            </CustomTooltip>
            <button
              onClick={() => {
                setData({
                  ...data,
                  winType: WIN_TYPE.AMOUNT,
                })
              }}
              className={`relative py-[8.4px] pl-6 pr-8 uppercase text-white ${
                !winType ? 'bg-primary-600 hover:bg-primary-400' : 'bg-neutral-700'
              } rounded-lg`}
              type='button'
            >
              <InfoIcon
                className={`absolute right-1 top-1 h-4 w-4 ${!winType ? 'stroke-white' : 'stroke-neutral-400'}`}
                data-tooltip-id='win-type-amount'
              />
              {t('Amount')}
            </button>
            <CustomTooltip
              className='z-50 min-w-[136px] max-w-[320px] !bg-neutral-500 shadow-xl after:!bg-neutral-500'
              id='win-type-amount'
              place='right'
            >
              {t('Win Type Amount tooltip')}
            </CustomTooltip>
          </div>
        </>
      )}

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
        maxAssets={tradingTokens.length}
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
