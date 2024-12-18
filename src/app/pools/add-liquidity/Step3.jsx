import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { TextIconButton } from '@/components/buttons/IconButton'
import FusionAdd from '@/components/common/AddLiquidity/FusionAdd'
import { EnterAmounts } from '@/components/common/AddLiquidity/FusionAdd/containers/EnterAmounts'
import ManualAdd from '@/components/common/AddLiquidity/FusionAdd/ManualAdd'
import ZapperInput from '@/components/common/AddLiquidity/FusionAdd/ZapperInput'
import IconGroup from '@/components/icongroup'
import Selection from '@/components/selection'
import { Paragraph, TextHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { useFusionPairs } from '@/context/fusionsContext'
import { useCurrency } from '@/hooks/fusion/Tokens'
import { cn, formatAmount, getPoolType, unwrappedSymbol } from '@/lib/utils'
import SettingSlippageModal from '@/modules/Position/SettingSlippageModal'
import { Bound } from '@/state/fusion/actions'
import { useV3DerivedMintInfo } from '@/state/fusion/hooks'
import { ArrowLeftIcon, CheckCircleIcon, DownloadSuccessIcon, PercentIcon, RightInIcon, RightOutIcon } from '@/svgs'

import TransactionSettingModal from './TransactionSettingModal'

const feeAmount = 3000
export default function Step3({ pool, isAutomatic, isAdd, setCurrentStep, strategy, showSidebar = true }) {
  const t = useTranslations()

  const [slippage, setSlippage] = useState(0.5)
  const [openTransactionSetting, setOpenTransactionSetting] = useState(false)

  const assets = useAssets()
  const fusionPairs = useFusionPairs()
  const [firstAsset, secondAsset] = useMemo(
    () => [
      assets.find(item => item.address.toLowerCase() === pool?.token0?.address.toLowerCase()),
      assets.find(item => item.address.toLowerCase() === pool?.token1?.address.toLowerCase()),
    ],
    [assets, pool],
  )
  const currencyA = useCurrency(firstAsset ? firstAsset.address : undefined)
  const currencyB = useCurrency(secondAsset ? secondAsset.address : undefined)

  const assetA = useMemo(
    () => assets.find(item => item.address?.toLowerCase() === firstAsset.address?.toLowerCase()),
    [firstAsset.address, assets],
  )

  const assetB = useMemo(
    () => assets.find(item => item.address?.toLowerCase() === secondAsset.address?.toLowerCase()),
    [secondAsset.address, assets],
  )

  const baseCurrency = currencyA
  const quoteCurrency = currencyB
  const mintInfo = useV3DerivedMintInfo(
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    feeAmount,
    baseCurrency ?? undefined,
    undefined,
  )

  const currentPrice = useMemo(() => {
    if (!mintInfo.price) return

    const _price = mintInfo.invertPrice
      ? parseFloat(mintInfo.price.invert().toSignificant(5))
      : parseFloat(mintInfo.price.toSignificant(5))

    if (Number(_price) <= 0.0001) {
      return '< 0.0001'
    }
    return _price
  }, [mintInfo.price, mintInfo.invertPrice])

  const pair = useMemo(() => {
    if (!pool) return
    const result = (fusionPairs ?? []).find(ele => pool?.address?.toLowerCase() === ele?.address)
    return {
      ...pool,
      currentTick: Number(result?.globalState.tick || 0),
    }
  }, [pool, fusionPairs])
  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = useMemo(() => mintInfo.ticks, [mintInfo])

  const [isZapper, setIsZapper] = useState(false)
  const addSelections = useMemo(
    () => [
      {
        label: 'Default',
        active: !isZapper,
        onClickHandler: () => {
          setIsZapper(false)
        },
      },
      {
        label: 'Zapper',
        active: isZapper,
        onClickHandler: () => {
          setIsZapper(true)
        },
      },
    ],
    [isZapper],
  )

  return (
    <div className='flex flex-col gap-6 lg:flex-row lg:gap-8'>
      <Box className={cn('w-full flex-[6] flex-col', !showSidebar ? 'w-full' : '')}>
        <div className='mb-3 inline-flex h-11 w-fit items-center'>
          <TextIconButton
            className='font-archia text-3xl text-neutral-50'
            Icon={ArrowLeftIcon}
            onClick={() => setCurrentStep(1)}
          />
          <h3>{t(showSidebar ? 'Add Liquidity' : 'New Deposit')}</h3>
        </div>
        <div className='mb-6 flex flex-row justify-between rounded-lg bg-neutral-800 p-4'>
          <div className='flex items-center gap-2'>
            <IconGroup
              className='-space-x-3'
              classNames={{
                image: 'outline-[2.6px] w-7 h-7',
              }}
              logo1={pair?.token0?.logoURI || UNKNOWN_LOGO}
              logo2={pair?.token1?.logoURI || UNKNOWN_LOGO}
            />
            {pair.type !== 'weighted' ? <TextHeading>{pair.symbol}</TextHeading> : <></>}
          </div>
          <NeutralBadge>{getPoolType(pair.type)}</NeutralBadge>
        </div>
        {isAutomatic ? (
          <FusionAdd strategy={isAdd ? pair : strategy} isAdd={isAdd} />
        ) : (
          <>
            <div className='flex justify-end'>
              <SettingSlippageModal slippage={slippage} updateSlippage={setSlippage} />
            </div>
            <div className='space-y-6'>
              <Selection className='w-full' data={addSelections} isFull isTranslation={false} />
              {isZapper ? (
                <ZapperInput asset1={assetA} asset2={assetB} />
              ) : (
                <EnterAmounts currencyA={baseCurrency} currencyB={quoteCurrency} mintInfo={mintInfo} />
              )}
              <>
                {Boolean(!mintInfo.noLiquidity) && isAutomatic && (
                  <>
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
                          <Paragraph>{formatAmount(pair?.account?.totalLp)} LP</Paragraph>
                        </div>
                        <div className='flex items-center justify-between'>
                          <Paragraph className='font-medium'>{t('Staked Liquidity')}</Paragraph>
                          <Paragraph>{formatAmount(pair?.account?.gaugeBalance)} LP</Paragraph>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
              <ManualAdd
                baseCurrency={baseCurrency}
                quoteCurrency={quoteCurrency}
                mintInfo={mintInfo}
                slippage={slippage}
                strategy={strategy}
              />
            </div>
          </>
        )}
      </Box>
      {showSidebar && (
        <div className='flex-[4]'>
          <Box className='flex flex-col gap-4'>
            <TextHeading className='font-archia text-2xl font-semibold'>{t('New Deposit')}</TextHeading>
            <p>{t('New Deposit description')}</p>
            <div className='flex flex-col gap-6'>
              <div className='flex flex-row items-center gap-2'>
                <CheckCircleIcon className='h-5 w-5 stroke-success-600' />
                <div className='flex flex-col'>
                  <div className='flex flex-row gap-1'>
                    <span>{t('Pool price tick at', { value: currentPrice })}</span>
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
                  <span>{t('slippage applied', { percent: slippage })}</span>
                  <span className='!cursor-pointer underline' onClick={() => setOpenTransactionSetting(true)}>
                    {t('Adjust')}
                  </span>
                </div>
              </div>
            </div>
          </Box>
        </div>
      )}
      <TransactionSettingModal
        isOpen={openTransactionSetting}
        setIsOpen={setOpenTransactionSetting}
        updateSlippage={setSlippage}
        slippage={slippage}
      />
    </div>
  )
}
