import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import Box from '@/components/box'
import { TextIconButton } from '@/components/buttons/IconButton'
import V1Add from '@/components/common/AddLiquidity/V1Add'
import { TextHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { useCustomAssets } from '@/context/customAssetsContext'
import { cn, formatAmount } from '@/lib/utils'
import { ArrowLeftIcon, DownloadSuccessIcon, PercentIcon } from '@/svgs'

import TransactionSettingModal from './TransactionSettingModal'

function AddLiquidityClassicAndStablePool({ pool, setCurrentStep, isAdd, showSidebar = true }) {
  const t = useTranslations()
  const assets = useAssets()
  const customAssets = useCustomAssets()
  const [firstAmount, setFirstAmount] = useState()
  const [secondAmount, setSecondAmount] = useState()
  const [slippage, setSlippage] = useState(0.5)
  const [openTransactionSetting, setOpenTransactionSetting] = useState(false)
  return (
    <>
      <Box className={cn('w-full flex-[6] flex-col py-3 lg:py-6')}>
        <div className='mb-4 h-11 w-fit'>
          {showSidebar ? (
            <TextHeading className='font-archia text-3xl text-neutral-50'>
              <TextIconButton Icon={ArrowLeftIcon} onClick={() => setCurrentStep(1)} />
              {t('Add Liquidity')}
            </TextHeading>
          ) : (
            <TextHeading className='font-archia text-3xl text-neutral-50'>{t('New Deposit')}</TextHeading>
          )}
        </div>

        <V1Add
          pairType={pool.type}
          firstAsset={[...assets, ...customAssets].find(
            asset => asset.address.toLowerCase() === pool?.token0?.address?.toLowerCase(),
          )}
          secondAsset={[...assets, ...customAssets].find(
            asset => asset.address.toLowerCase() === pool?.token1?.address?.toLowerCase(),
          )}
          setFirstAmountValue={setFirstAmount}
          setSecondAmountValue={setSecondAmount}
          // setFirstAddress={setFirstAddress}
          // setSecondAddress={setSecondAddress}
          isAdd={isAdd}
          slippage={slippage}
          setSlippage={setSlippage}
        />
      </Box>
      {showSidebar && (
        <div className='flex-[4]'>
          <Box className='flex flex-col gap-4'>
            <TextHeading className='font-archia text-2xl font-semibold'>{t('New Deposit')}</TextHeading>
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
                            <span>{formatAmount(0)} THE</span>
                          </div>
                        </div>
                      </div>
                      <div className='flex flex-row items-center gap-2'>
                        <PercentIcon className='h-5 w-5 stroke-success-600' />
                        <div className='flex flex-row gap-1'>
                          <span>{t('slippage applied', { percent: slippage })}</span>
                          <span className='!cursor-pointer underline' onClick={() => setOpenTransactionSetting(true)}>
                            {t('Adjust')}
                          </span>
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
        slippage={slippage}
        updateSlippage={setSlippage}
      />
    </>
  )
}

export default AddLiquidityClassicAndStablePool
