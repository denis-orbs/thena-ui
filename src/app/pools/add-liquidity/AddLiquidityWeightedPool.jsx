import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'

import MenuTab from '@/app/arena/rankings/MenuTab'
import SuccessModal from '@/app/arena/thena-id/SuccessModal'
import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { TextIconButton } from '@/components/buttons/IconButton'
import { ThreeIconGroup } from '@/components/icongroup/ThreeIconGroup'
import BalanceInput from '@/components/input/BalanceInput'
import InputManyToken from '@/components/input/InputManyToken'
import TokenInput from '@/components/input/TokenInput'
import Tabs from '@/components/tabs'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { useWeightedPool } from '@/hooks/weightedPool/useWeigtedPool'
import { cn, formatAmount, roundIfMoreThan18Decimals, toWei } from '@/lib/utils'
import { ArrowLeftIcon, ArrowRightIcon, DownloadSuccessIcon, PercentIcon } from '@/svgs'

import TransactionSettingModal from './TransactionSettingModal'

const DEPOSIT_TYPE = {
  SINGLE: 'single',
  ALL: 'all',
}

function AddLiquidityWeightedPool({ pool, isFullContent = true, showSidebar = true, setCurrentStep }) {
  const t = useTranslations()
  const [depositType, setDepositType] = useState(DEPOSIT_TYPE.SINGLE)
  const [tokenDeposit, setTokenDeposit] = useState(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const [amountDeposit, setAmountDeposit] = useState()

  const [slippageTolerance, setSlippageTolerance] = useState()
  const [openTransactionSetting, setOpenTransactionSetting] = useState()

  const { onAddLiquiditySingleToken, onAddLiquidityAllToken, pending } = useWeightedPool()

  const [tokensData, setTokensData] = useState(
    (pool.tokens || []).map(item => ({
      ...item,
      amountDeposit: null,
    })),
  )

  const handleAmountChange = useCallback(
    (address, value) => {
      setTokensData(prev =>
        prev.map(token => ({
          ...token,
          amountDeposit:
            token?.address?.toLowerCase() === address?.toLowerCase()
              ? roundIfMoreThan18Decimals(value)
              : token.amountDeposit,
        })),
      )
    },
    [setTokensData],
  )

  const toggleDepositType = useMemo(
    () => [
      {
        title: t('Deposit Single Token'),
        isActive: depositType === DEPOSIT_TYPE.SINGLE,
        isLink: false,
        onClick: () => setDepositType(DEPOSIT_TYPE.SINGLE),
      },
      {
        title: t('Deposit All Token'),
        isActive: depositType === DEPOSIT_TYPE.ALL,
        isLink: false,
        onClick: () => setDepositType(DEPOSIT_TYPE.ALL),
      },
    ],
    [depositType, t],
  )
  const percents = useMemo(
    () => [
      {
        label: '10%',
        onClickHandler: () => setAmountDeposit(pool?.token0?.balance.times(0.1).toString(10)),
      },
      {
        label: '25%',
        onClickHandler: () => setAmountDeposit(pool?.token0?.balance.times(0.25).toString(10)),
      },
      {
        label: '50%',
        onClickHandler: () => setAmountDeposit(pool?.token0?.balance.times(0.5).toString(10)),
      },
      {
        label: 'Max',
        onClickHandler: () => setAmountDeposit(pool?.token0?.balance.toString(10)),
      },
    ],
    [pool?.token0?.balance, setAmountDeposit],
  )

  const isDisable = useMemo(() => {
    if (pending) return true

    if (depositType === DEPOSIT_TYPE.SINGLE) {
      if (!tokenDeposit || amountDeposit <= 0) {
        return true
      }
    }

    if (depositType === DEPOSIT_TYPE.ALL) {
      const checkAmountValid = tokensData.every(token => token.amountDeposit > 0)
      if (!checkAmountValid) return true
    }

    return false
  }, [amountDeposit, depositType, pending, tokenDeposit, tokensData])

  const onAddLiquidity = useCallback(async () => {
    console.log({ tokensData })
    if (depositType === DEPOSIT_TYPE.SINGLE) {
      await onAddLiquiditySingleToken(pool.poolId, tokenDeposit, toWei(amountDeposit), () => {
        setIsSuccess(true)
      })
    } else {
      const assetsToken = tokensData.map(token => ({
        ...token,
        amountDeposit: toWei(token.amountDeposit),
      }))
      await onAddLiquidityAllToken(pool.poolId, assetsToken, () => {
        setIsSuccess(true)
      })
    }
  }, [
    amountDeposit,
    depositType,
    onAddLiquidityAllToken,
    onAddLiquiditySingleToken,
    pool.poolId,
    tokenDeposit,
    tokensData,
  ])

  const isEnteredAmount = useMemo(() => {
    if (depositType === DEPOSIT_TYPE.SINGLE) {
      if (tokenDeposit || amountDeposit > 0) {
        return true
      }
    }

    if (depositType === DEPOSIT_TYPE.ALL) {
      return tokensData.some(token => token.amountDeposit > 0)
    }
    return false
  }, [amountDeposit, depositType, tokenDeposit, tokensData])

  return (
    <>
      <Box className={cn('w-full flex-[6] flex-col py-3 lg:py-6', !showSidebar ? 'w-full' : '')}>
        <div className='mb-4 h-11 w-fit'>
          {showSidebar ? (
            <TextHeading className='font-archia text-3xl text-neutral-50'>
              <TextIconButton Icon={ArrowLeftIcon} onClick={() => setCurrentStep(0)} />
              {t(pool?.type === PAIR_TYPES.LSD ? 'Choose Strategy' : 'Add Liquidity')}
            </TextHeading>
          ) : (
            <TextHeading className='font-archia text-3xl text-neutral-50'>
              {t(pool?.type === PAIR_TYPES.LSD ? 'Choose Strategy' : 'New Deposit')}
            </TextHeading>
          )}
        </div>
        <div className='flex flex-col gap-6'>
          {isFullContent && (
            <div className='flex flex-col gap-3'>
              <TextHeading>{pool?.symbol}</TextHeading>
              <div className='flex flex-row justify-between rounded-lg bg-neutral-800 p-4'>
                <div className='flex items-center gap-2'>
                  <ThreeIconGroup
                    classNames={{
                      image: 'w-8 h-8 text-xl font-medium leading-5 text-[#1C2027]',
                    }}
                    logo1={pool?.tokens?.[0].logoURI ?? UNKNOWN_LOGO}
                    logo2={pool?.tokens?.[1].logoURI ?? UNKNOWN_LOGO}
                    extendNumber={(pool?.tokens?.length || 2) - 2}
                  />
                  <div className='flex items-center gap-2 lg:max-w-[90%]'>
                    <div className='flex w-full flex-wrap items-center gap-1 '>
                      {(pool?.tokens || []).map(token => (
                        <div className='flex items-center gap-1' key={token?.address}>
                          <span className='text-[16px] font-medium leading-5'>{token?.symbol}</span>
                          <span className='text-sm font-medium leading-5 text-neutral-300 '>{token?.weight}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <NeutralBadge>{t('Weighted')}</NeutralBadge>
              </div>
            </div>
          )}
          <MenuTab className='grid w-full grid-cols-2' menuData={toggleDepositType} />
          <div className='flex flex-col'>
            {depositType === DEPOSIT_TYPE.SINGLE && (
              <>
                <div className='flex flex-row justify-between'>
                  <TextHeading>{t('Deposit Token')}</TextHeading> <Tabs data={percents} />
                </div>
                <div className='relative flex w-full flex-col gap-2'>
                  <TokenInput
                    asset={tokenDeposit}
                    setAsset={setTokenDeposit}
                    amount={amountDeposit}
                    setAmount={setAmountDeposit}
                    autoFocus
                    assetData={tokensData}
                    assetNull
                  />
                </div>
              </>
            )}
            {depositType === DEPOSIT_TYPE.ALL &&
              (tokensData || []).map((token, idx) => (
                <BalanceInput
                  type='number'
                  key={token?.address}
                  amount={token.amountDeposit}
                  asset={token}
                  title={`${t('Deposit Token')} ${idx + 1}`}
                  autoFocus={idx === 0}
                  onAmountChange={value => handleAmountChange(token.address, value)}
                />
              ))}
          </div>
          <ArrowRightIcon className='mx-auto h-5 w-5 rotate-90' />
          <div className='relative flex w-full gap-2'>
            <InputManyToken readOnly amount={0} balance={0} pair={pool} title='LP' />
          </div>
          <div className='flex flex-row justify-between'>
            <TextHeading>{t('Total Deposit')}</TextHeading>
            <Paragraph>${formatAmount(0)}</Paragraph>
          </div>
          <PrimaryButton disabled={isDisable} onClick={onAddLiquidity} className='w-full'>
            {t('Add Liquidity')}
          </PrimaryButton>
          <SuccessModal
            isOpen={isSuccess}
            heading={t('Deposit Successful!')}
            message={t('You have successfully deposit to [symbol]', { poolSymbol: pool.symbol })}
            onClose={() => {
              setIsSuccess(false)
            }}
            buttonAction={
              <Link onClick={() => setIsSuccess(false)} href={`/pools/${pool?.address?.toLowerCase()}`}>
                <EmphasisButton className='w-full'>{t('View Pool')}</EmphasisButton>
              </Link>
            }
          />
        </div>
      </Box>
      {showSidebar && (
        <div className='flex-[4]'>
          <Box className='flex flex-col gap-4'>
            <TextHeading className='font-archia text-2xl font-semibold'>{t('New Deposit')}</TextHeading>
            {pool.type === PAIR_TYPES.WEIGHTED && (
              <>
                {!isEnteredAmount ? (
                  <div className='flex flex-col gap-6'>
                    <p>{t('New Deposit description')}</p>
                    <p>{t('You can also choose to stake your liquidity')}</p>
                  </div>
                ) : (
                  <>
                    <div className='flex flex-col gap-6'>
                      <div className='flex flex-row items-center gap-2'>
                        <DownloadSuccessIcon className='h-5 w-5 stroke-success-600' />
                        <div className='flex flex-col'>
                          <div className='flex flex-row gap-1'>
                            <span>{t('Quote for deposit received')}</span>
                            <Link href='/'>{t('Refresh')}</Link>
                          </div>
                          <div>
                            <span>{formatAmount(0)} THE</span>
                          </div>
                        </div>
                      </div>
                      <div className='flex flex-row items-center gap-2'>
                        <PercentIcon className='h-5 w-5 stroke-success-600' />
                        <div className='flex flex-row gap-1'>
                          <span>{t('slippage applied', { percent: '1.0' })}</span>
                          <p className='!cursor-pointer underline'>{t('Adjust')}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </Box>
        </div>
      )}
      <TransactionSettingModal
        isOpen={openTransactionSetting}
        setIsOpen={setOpenTransactionSetting}
        setSlippageTolerance={setSlippageTolerance}
        slippageTolerance={slippageTolerance}
      />
    </>
  )
}

export default AddLiquidityWeightedPool
