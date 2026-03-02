'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import useSWR from 'swr'
import { JSBI, WBNB } from 'thena-sdk-core'

import { HypervisorV2ABI } from '@/abis/gamma/HypervisorV2ABI'
import SlippageContent from '@/app/pools/(add-liquidity)/add-liquidity/SlippageContent'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import { TextHeading } from '@/components/typography'
import { FusionRangeType } from '@/constant'
import { useCurrency } from '@/hooks/fusion/Tokens'
import { useCurrencyBalance } from '@/hooks/fusion/useCurrencyBalances'
import { useAddGamma } from '@/hooks/fusion/useGamma'
import useWallet from '@/hooks/useWallet'
import { callMulti } from '@/lib/contractActions'
import { warnToast } from '@/lib/notify'
import PoolTitle from '@/modules/PoolTitle'
import { Field, updateSelectedPreset } from '@/state/fusion/actions'
import { useV3DerivedMintInfo, useV3MintActionHandlers } from '@/state/fusion/hooks'
import { useChainSettings } from '@/state/settings/hooks'
import cn from '@/utils/classes'

import SettingsIcon from '~/svgs/settings.svg'

import { EnterAmounts } from './containers/EnterAmounts'

const feeAmount = 3000

export const fetchGammaInfo = async (chainId, strategy) => {
  const values = await callMulti([
    {
      address: strategy.address,
      abi: HypervisorV2ABI,
      functionName: 'baseLower',
      args: [],
      chainId,
    },
    {
      address: strategy.address,
      abi: HypervisorV2ABI,
      functionName: 'baseUpper',
      args: [],
      chainId,
    },
    {
      address: strategy.address,
      abi: HypervisorV2ABI,
      functionName: 'currentTick',
      args: [],
      chainId,
    },
  ])
  const lowerValue = 1.0001 ** Number(values[0] - values[2])
  const upperValue = 1.0001 ** Number(values[1] - values[2])
  return {
    type: strategy.title,
    title: strategy.title,
    address: strategy.address,
    min: lowerValue,
    max: upperValue,
  }
}

export default function GammaAdd({
  strategy,
  isModal,
  isAdd,
  onShowModalSuccess,
  handleBack,
  isSmall = false,
  classNames,
  label,
  gaugeAlive,
}) {
  // const t = useTranslations()

  // const [isZapper, setIsZapper] = useState(false)

  const baseCurrency = useCurrency(strategy?.token0?.address)
  const quoteCurrency = useCurrency(strategy?.token1?.address)
  const [slippage, setSlippage] = useState(0.5)
  const [slippageDropdown, setSlippageDropdown] = useState(false)

  // const asset0 = useGetAsset(strategy?.token0?.address)
  // const asset1 = useGetAsset(strategy?.token1?.address)

  // const addSelections = useMemo(
  //   () => [
  //     {
  //       label: t('Pool Token Deposit'),
  //       active: !isZapper,
  //       onClickHandler: () => {
  //         setIsZapper(false)
  //       },
  //     },
  // {
  //   label: (
  //     <div className='flex items-center justify-center gap-1'>
  //       <ZapperIcon className='size-5' />
  //       <span>{t('Zapper Deposit')}</span>
  //     </div>
  //   ),
  //   active: isZapper,
  //   onClickHandler: () => {
  //     setIsZapper(true)
  //   },
  // },
  //   ],
  //   [isZapper, t],
  // )

  return (
    <div className={cn('inline-flex w-full flex-col gap-5', isModal && 'p-3 lg:px-6')}>
      <div className='flex flex-col gap-2'>
        {isAdd && strategy && <PoolTitle strategy={strategy} />}
        <div className='flex w-full items-center justify-between gap-2'>
          {/* <Selection data={addSelections} isFull isTranslation={false} className='flex-1' /> */}
          {/* <EmphasisIconButton
            className='size-8 lg:size-11'
            classNames='size-4 stroke-neutral-400'
            Icon={SettingsIcon}
            onClick={() => setSlippageDropdown(prev => !prev)}
            disabled={false}
          /> */}
          <div className='flex w-full items-center justify-between'>
            <TextHeading className='font-archia font-semibold'>{label}</TextHeading>
            <EmphasisIconButton
              className='size-8 lg:size-11'
              classNames='size-4 stroke-neutral-400'
              Icon={SettingsIcon}
              onClick={() => setSlippageDropdown(prev => !prev)}
              disabled={false}
            />
          </div>
        </div>
        <SlippageContent setSlippage={setSlippage} slippage={slippage} show={slippageDropdown} />
        {/* <SettingSlippageDropDown slippage={slippage} updateSlippage={setSlippage} className='mb-4' /> */}

        {/* Temporary remove zapper */}
        {/* (
          <CommonZapperPane
            asset0={asset0}
            asset1={asset1}
            strategy={strategy}
            onShowModalSuccess={onShowModalSuccess}
            handleBack={handleBack}
            isSmall={isSmall}
          />
        )  */}
        {/* {!isZapper && ( */}
        <ManualPanel
          baseCurrency={baseCurrency}
          quoteCurrency={quoteCurrency}
          strategy={strategy}
          onShowModalSuccess={onShowModalSuccess}
          handleBack={handleBack}
          isSmall={isSmall}
          classNames={classNames}
          slippage={slippage}
          gaugeAlive={gaugeAlive}
        />
        {/* )} */}
      </div>
    </div>
  )
}

function ManualPanel({
  baseCurrency,
  quoteCurrency,
  strategy,
  onShowModalSuccess,
  handleBack,
  isSmall = false,
  classNames,
  slippage,
  gaugeAlive,
}) {
  const t = useTranslations()
  const { account } = useWallet()
  const { networkId } = useChainSettings()
  const mintInfo = useV3DerivedMintInfo(baseCurrency, quoteCurrency, feeAmount, baseCurrency, undefined)

  const { onChangePresetRange, onLeftRangeInput, onRightRangeInput, onChangeLiquidityRangeType } =
    useV3MintActionHandlers(mintInfo.noLiquidity)

  const amountA = mintInfo.parsedAmounts[Field.CURRENCY_A]
  const amountB = mintInfo.parsedAmounts[Field.CURRENCY_B]
  const wbnbBalance = useCurrencyBalance(WBNB[networkId])

  const errorMessage = useMemo(() => mintInfo.errorMessage, [mintInfo.errorMessage])

  const { handleAddGamma, pending } = useAddGamma()
  const dispatch = useDispatch()

  const { data: preset } = useSWR(
    strategy && ['gamma/info', strategy.address],
    () => fetchGammaInfo(networkId, strategy),
    {
      refreshInterval: 0,
    },
  )

  const price = useMemo(() => {
    if (!mintInfo.price) return

    return mintInfo.invertPrice ? mintInfo.price.invert().toSignificant(5) : mintInfo.price.toSignificant(5)
  }, [mintInfo])

  const amountToWrap = useMemo(() => {
    if (!baseCurrency || !quoteCurrency || !amountA || !amountB) return
    if (baseCurrency.isNative || baseCurrency.wrapped.address.toLowerCase() === WBNB[networkId].address.toLowerCase()) {
      if (wbnbBalance && JSBI.greaterThan(amountA.numerator, wbnbBalance.numerator)) {
        return JSBI.subtract(amountA.numerator, wbnbBalance.numerator)
      }
    } else if (
      quoteCurrency.isNative ||
      quoteCurrency.wrapped.address.toLowerCase() === WBNB[networkId].address.toLowerCase()
    ) {
      if (wbnbBalance && JSBI.greaterThan(amountB.numerator, wbnbBalance.numerator)) {
        return JSBI.subtract(amountB.numerator, wbnbBalance.numerator)
      }
    }
  }, [amountA, amountB, baseCurrency, quoteCurrency, wbnbBalance, networkId])

  useEffect(() => {
    if (!price) return

    dispatch(updateSelectedPreset({ preset: preset ? preset.type : null }))

    onLeftRangeInput(preset ? String(+price * preset.min) : '')
    onRightRangeInput(preset ? String(+price * preset.max) : '')
    onChangePresetRange(preset)

    onChangeLiquidityRangeType(FusionRangeType.GAMMA_RANGE)
  }, [preset, dispatch, onChangePresetRange, onLeftRangeInput, onRightRangeInput, onChangeLiquidityRangeType, price])

  const onAddLiquidity = useCallback(() => {
    if (errorMessage) {
      warnToast(errorMessage, 'warn')
      return
    }
    handleAddGamma({ amountA, amountB, amountToWrap, gammaPair: strategy, slippage }, onShowModalSuccess)
  }, [amountA, amountB, amountToWrap, handleAddGamma, onShowModalSuccess, slippage, strategy, errorMessage])

  return (
    <div>
      <div className='flex flex-col'>
        <EnterAmounts
          currencyA={baseCurrency}
          currencyB={quoteCurrency}
          mintInfo={mintInfo}
          isSmall={isSmall}
          className={classNames?.wrapperInput}
          classNames={{ input: classNames?.input }}
        />

        {/* <div className='mt-5 flex flex-col gap-4'>
          <TextHeading className='text-lg'>{t('Reserve Info')}</TextHeading>
          <div className='flex flex-col gap-3'>
            <div className='flex items-center justify-between'>
              <Paragraph className='font-medium'>
                {unwrappedSymbol(strategy?.token0)} {t('Amount')}
              </Paragraph>
              <Paragraph>{formatAmount(strategy?.token0?.reserve)}</Paragraph>
            </div>
            <div className='flex items-center justify-between'>
              <Paragraph className='font-medium'>
                {unwrappedSymbol(strategy?.token1)} {t('Amount')}
              </Paragraph>
              <Paragraph>{formatAmount(strategy?.token1?.reserve)}</Paragraph>
            </div>
          </div>
        </div>
        <div className='mt-4 flex flex-col gap-4 border-t border-neutral-700 pt-4'>
          <TextHeading className='text-lg'>{t('My Info')}</TextHeading>
          <div className='flex flex-col gap-3'>
            <div className='flex items-center justify-between'>
              <Paragraph className='font-medium'>{t('Pooled Liquidity')}</Paragraph>
              <Paragraph>{formatAmount(strategy?.account?.totalLp)} LP</Paragraph>
            </div>
            <div className='flex items-center justify-between'>
              <Paragraph className='font-medium'>{t('Staked Liquidity')}</Paragraph>
              <Paragraph>{formatAmount(strategy?.account?.gaugeBalance)} LP</Paragraph>
            </div>
          </div>
        </div> */}
      </div>

      <div className={cn('mt-8 flex w-full flex-col items-center gap-2 lg:flex-row')}>
        <EmphasisButton className='block w-full xl:hidden' onClick={handleBack}>
          {t('Cancel')}
        </EmphasisButton>
        {account ? (
          <>
            <PrimaryButton disabled={pending || !gaugeAlive} onClick={onAddLiquidity} className='w-full'>
              {t('Deposit')}
            </PrimaryButton>
          </>
        ) : (
          <ConnectButton className='w-full' />
        )}
      </div>
    </div>
  )
}
