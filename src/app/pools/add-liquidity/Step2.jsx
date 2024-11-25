import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import MenuTab from '@/app/arena/rankings/MenuTab'
import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import ChooseStrategy from '@/components/common/AddLiquidity/ChooseStrategy'
import V1Add from '@/components/common/AddLiquidity/V1Add'
import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import DoubleInput from '@/components/input/DoubleInput'
import TokenInput from '@/components/input/TokenInput'
import Tabs from '@/components/tabs'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { ArrowLeftIcon, ArrowRightIcon, DownloadSuccessIcon, PercentIcon } from '@/svgs'

const DEPOSIT_TYPE = {
  SINGLE: 'single',
  ALL: 'all',
}

function AddLiquidityWeightedPool({ pool, setAmount, amount }) {
  const t = useTranslations()
  const [depositType, setDepositType] = useState(DEPOSIT_TYPE.SINGLE)
  const [tokenDeposit, setTokenDeposit] = useState(null)
  const assets = useAssets()

  const tokensData = useMemo(() => {
    const result = assets.filter(
      asset =>
        asset.address.toLowerCase() === pool.token0.address.toLowerCase() ||
        asset.address.toLowerCase() === pool.token1.address.toLowerCase(),
    )
    return result
  }, [assets, pool.token0.address, pool.token1.address])

  const toggleDepositType = useMemo(
    () => [
      {
        title: t('Deposit Single Token'),
        isActive: depositType === DEPOSIT_TYPE.SINGLE,
        isLink: false,
        onClick: () => setDepositType(DEPOSIT_TYPE.SINGLE),
      },
      {
        title: t('Available THENA IDs'),
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
        onClickHandler: () => setAmount(pool.token0.balance.times(0.1).toString(10)),
      },
      {
        label: '25%',
        onClickHandler: () => setAmount(pool.token0.balance.times(0.25).toString(10)),
      },
      {
        label: '50%',
        onClickHandler: () => setAmount(pool.token0.balance.times(0.5).toString(10)),
      },
      {
        label: 'Max',
        onClickHandler: () => setAmount(pool.token0.balance.toString(10)),
      },
    ],
    [pool.token0.balance, setAmount],
  )

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-3'>
        <TextHeading>{pool.symbol}</TextHeading>
        <div className='flex flex-row justify-between rounded-lg bg-neutral-800 p-4'>
          <div className='flex items-center gap-2'>
            <IconGroup
              className='-space-x-3'
              classNames={{
                image: 'outline-[2.6px] w-7 h-7',
              }}
              logo1={pool?.token0?.logoURI || UNKNOWN_LOGO}
              logo2={pool?.token1?.logoURI || UNKNOWN_LOGO}
            />
            {pool.type !== 'Weighted' ? (
              <TextHeading>{pool.symbol}</TextHeading>
            ) : (
              <div className='flex flex-row gap-3'>
                <div className='flex flex-row gap-1'>
                  <span>{pool?.token0?.symbol}</span>
                  <Paragraph>50%</Paragraph>
                </div>
                <div className='flex flex-row gap-1'>
                  <span>{pool?.token1?.symbol}</span>
                  <Paragraph>50%</Paragraph>
                </div>
              </div>
            )}
          </div>
          <NeutralBadge>{t('Weighted')}</NeutralBadge>
        </div>
      </div>
      <MenuTab className='grid w-full grid-cols-2' menuData={toggleDepositType} />
      <div className='flex flex-col'>
        <div className='flex flex-row justify-between'>
          <TextHeading>{t('Deposit Token')}</TextHeading> <Tabs data={percents} />
        </div>
        <div className='relative flex w-full flex-col gap-2'>
          <TokenInput
            asset={tokenDeposit}
            setAsset={setTokenDeposit}
            // otherAsset={toAsset}
            // setOtherAsset={asset => setToAddress(asset.address)}
            amount={amount}
            setAmount={setAmount}
            autoFocus
            assetData={tokensData}
            assetNull
          />
        </div>
      </div>
      <ArrowRightIcon className='mx-auto h-5 w-5 rotate-90' />
      <div className='relative flex w-full flex-col gap-2'>
        <TextHeading>LP</TextHeading>
        <DoubleInput pair={pool} onAmountChange={setAmount} />
      </div>
      <div className='flex flex-col gap-4'>
        <TextHeading>{t('Reserve Info')}</TextHeading>
        <div className='flex flex-row justify-between'>
          <Paragraph>
            {pool.token0.symbol} {t('Amount')}
          </Paragraph>
          <Paragraph>{amount}</Paragraph>
        </div>
        <div className='flex flex-row justify-between'>
          <Paragraph>
            {pool.token1.symbol} {t('Amount')}
          </Paragraph>
          <Paragraph>{amount}</Paragraph>
        </div>
      </div>
      {depositType === DEPOSIT_TYPE.ALL && (
        <div className='flex flex-col gap-4'>
          <TextHeading>{t('You will deposit')}</TextHeading>
          <div className='flex flex-row justify-between'>
            <div className='flex flex-row items-center gap-1'>
              <CircleImage className='h-5 w-5' alt={pool.token0.symbol} src={pool?.token0?.logoURI} />
              <Paragraph>{pool.token0.symbol}</Paragraph>
            </div>
            <Paragraph>{0}</Paragraph>
          </div>
          <div className='flex flex-row justify-between'>
            <div className='flex flex-row items-center gap-1'>
              <CircleImage className='h-5 w-5' alt={pool.token1.symbol} src={pool?.token1?.logoURI} />
              <Paragraph>{pool.token1.symbol}</Paragraph>
            </div>
            <Paragraph>{0}</Paragraph>
          </div>
        </div>
      )}
      <PrimaryButton className='w-full'>{t('Add Liquidity')}</PrimaryButton>
    </div>
  )
}

export default function Step2({ pool, setCurrentStep, isAutomatic, setIsAutomatic, strategy, setStrategy, isAdd }) {
  const t = useTranslations()
  const [amount, setAmount] = useState()
  const assets = useAssets()
  const [firstAmount, setFirstAmount] = useState()
  const [secondAmount, setSecondAmount] = useState()
  const [isReverse, setIsReverse] = useState(true)
  return (
    <div className='mt-10 flex flex-col gap-6 lg:flex-row lg:gap-8'>
      <Box className='flex w-full flex-col lg:w-[540px]'>
        <div className='mb-4 h-11 w-fit'>
          <TextButton
            className='font-archia text-3xl text-neutral-50'
            LeadingIcon={ArrowLeftIcon}
            onClick={() => setCurrentStep(0)}
          >
            {t(pool?.type === PAIR_TYPES.LSD ? 'Choose Strategy' : 'Add Liquidity')}
          </TextButton>
        </div>
        {pool.type === PAIR_TYPES.WEIGHTED && (
          <AddLiquidityWeightedPool pool={pool} setAmount={setAmount} amount={amount} />
        )}
        {pool.type === PAIR_TYPES.LSD && (
          <ChooseStrategy
            pairType={PAIR_TYPES.LSD}
            firstAsset={assets.find(asset => asset.address.toLowerCase() === pool?.token0?.address?.toLowerCase())}
            secondAsset={assets.find(asset => asset.address.toLowerCase() === pool?.token1?.address?.toLowerCase())}
            strategy={strategy}
            setStrategy={setStrategy}
            setCurrentStep={setCurrentStep}
            isAutomatic={isAutomatic}
            setIsAutomatic={setIsAutomatic}
            isReverse={isReverse}
            setIsReverse={setIsReverse}
            // isModal={isModal}
          />
        )}

        {(pool.type === PAIR_TYPES.CLASSIC || pool.type === PAIR_TYPES.STABLE) && (
          <V1Add
            pairType={pool.type}
            firstAsset={assets.find(asset => asset.address.toLowerCase() === pool?.token0?.address?.toLowerCase())}
            secondAsset={assets.find(asset => asset.address.toLowerCase() === pool?.token1?.address?.toLowerCase())}
            setFirstAmountValue={setFirstAmount}
            setSecondAmountValue={setSecondAmount}
            // setFirstAddress={setFirstAddress}
            // setSecondAddress={setSecondAddress}
            isAdd={isAdd}
          />
        )}
      </Box>
      <div className='lg:w-[496px]'>
        <Box className='flex flex-col gap-4'>
          <TextHeading className='font-archia text-2xl font-semibold'>{t('New Deposit')}</TextHeading>
          {pool.type === PAIR_TYPES.WEIGHTED && (
            <>
              {!amount ? (
                <div className='flex flex-col gap-6'>
                  <p>{t('New Deposit description')}</p>
                  {isAdd && <p>{t('You can also choose to stake your liquidity')}</p>}
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
                          {/* TODO: mock data */}
                          <span>{amount} THE</span>
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
                </>
              )}
            </>
          )}

          {(pool.type === PAIR_TYPES.CLASSIC || pool.type === PAIR_TYPES.STABLE) && (
            <>
              {!firstAmount && !secondAmount ? (
                <div className='flex flex-col gap-6'>
                  <p>{t('New Deposit description')}</p>
                  {pool?.type === PAIR_TYPES.CLASSIC && <p>{t('You can also choose to stake your liquidity')}</p>}
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
                          {/* TODO: mock data */}
                          <span>{amount} THE</span>
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
                </>
              )}
            </>
          )}

          {pool?.type === PAIR_TYPES.LSD && (
            <>
              {isAdd ? (
                <div className='flex flex-col gap-6'>
                  <p>{t('New Deposit description')}</p>
                  {isAdd && <p>{t('You can also choose to stake your liquidity')}</p>}
                </div>
              ) : (
                <>
                  <div className='flex flex-col gap-6'>
                    <p>{t('This pool requires maintenance')}</p>
                    <p>
                      <strong>{t('Automatic Strategy title')}: </strong>
                      <span>{t('Automatic Strategy description')}</span>
                    </p>
                    <p>
                      <strong>{t('Manual Strategy title')}: </strong>
                      <span>{t('Manual Strategy description')}</span>
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </Box>
      </div>
    </div>
  )
}
