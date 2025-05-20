'use client'

import BigNumber from 'bignumber.js'
import React, { useCallback, useMemo, useState } from 'react'
import { CurrencyAmount, Percent } from 'thena-sdk-core'

import { GreenBadge, PrimaryBadge } from '@/components/badges/Badge'
import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import CustomSlider from '@/components/slider'
import { Paragraph, TextHeading } from '@/components/typography'
import { useAlgebraRemove } from '@/hooks/fusion/useAlgebra'
import useDebounce from '@/hooks/useDebounce'
import { warnToast } from '@/lib/notify'
import { formatAmount, unwrappedSymbol } from '@/lib/utils'
import { useSettings } from '@/state/settings/hooks'

import SettingSlippageDropDown from './SettingSlippageDropDown'

export default function RemoveManualModal({
  popup,
  setPopup,
  pool,
  position,
  reward0,
  reward1,
  mutateManual,
  outOfRange,
  fee,
}) {
  const [percent, setPercent] = useState(0)
  const debouncedPercent = useDebounce(percent)
  const { deadline } = useSettings()
  const [slippage, setSlippage] = useState(0.5)
  const liquidityPercentage = useMemo(() => new Percent(percent, 100), [percent])
  const { pending, onAlgebraRemove } = useAlgebraRemove(pool?.version ?? 3)

  const { pool: _pool, amount0, amount1 } = position ?? {}
  const liquidityValue0 = useMemo(() => ((amount0?.toExact() || 0) * percent) / 100, [amount0, percent])
  const liquidityValue1 = useMemo(() => ((amount1?.toExact() || 0) * percent) / 100, [amount1, percent])

  const onRemove = useCallback(() => {
    const farmReward = pool?.isFarming
      ? {
          reward0: reward0.amount,
          reward1: reward1.amount,
          poolkey: pool.key,
        }
      : {}

    if (debouncedPercent > 0) {
      onAlgebraRemove({
        tokenId: pool?.tokenId,
        farmReward,
        position,
        liquidityPercentage,
        currency0: CurrencyAmount.fromRawAmount(_pool?.token0, BigNumber(0n)),
        currency1: CurrencyAmount.fromRawAmount(_pool?.token1, BigNumber(0n)),
        slippage,
        deadline,
        callback: () => {
          setPercent(0)
          setPopup(false)
          mutateManual()
        },
      })
    } else {
      warnToast('Invalid Amount', 'warn')
    }
  }, [
    _pool?.token0,
    _pool?.token1,
    deadline,
    debouncedPercent,
    liquidityPercentage,
    mutateManual,
    onAlgebraRemove,
    pool,
    position,
    reward0.amount,
    reward1.amount,
    setPopup,
    slippage,
  ])

  return (
    <Modal
      isOpen={popup}
      title='Remove Liquidity'
      closeModal={() => {
        setPopup(false)
      }}
      onAfterClose={() => setPercent(0)}
    >
      <ModalBody>
        <div className='flex items-center justify-between rounded-lg bg-neutral-800 p-3'>
          <div className='flex items-center gap-3'>
            <IconGroup
              className='-space-x-2'
              classNames={{ image: 'w-8 h-8 outline-2' }}
              logo1={pool.asset0?.logoURI}
              logo2={pool.asset1?.logoURI}
            />
            <div className='flex flex-col gap-1'>
              <TextHeading>
                {unwrappedSymbol(pool.asset0)}/{unwrappedSymbol(pool.asset1)}
              </TextHeading>
              <Paragraph className='text-xs'>
                #{pool.tokenId} / {fee / 10000}% Fee
              </Paragraph>
            </div>
          </div>
          {outOfRange ? <PrimaryBadge>Out of Range</PrimaryBadge> : <GreenBadge>In Range</GreenBadge>}
        </div>
        <div className='flex justify-end'>
          <SettingSlippageDropDown slippage={slippage} updateSlippage={setSlippage} position='end' />
        </div>
        <div className='flex flex-col gap-4'>
          <CustomSlider percent={percent} onPercentChange={setPercent} />
          <TextHeading>You will receive</TextHeading>
          <div className='flex flex-col gap-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-1'>
                <CircleImage className='h-4 w-4' src={pool.asset0?.logoURI} alt='thena logo' />
                <Paragraph className='text-sm'>Pooled {pool.asset0?.symbol}</Paragraph>
              </div>
              <Paragraph>{formatAmount(liquidityValue0, false, 4)}</Paragraph>
            </div>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-1'>
                <CircleImage className='h-4 w-4' src={pool.asset1?.logoURI} alt='thena logo' />
                <Paragraph className='text-sm'>Pooled {pool.asset1?.symbol}</Paragraph>
              </div>
              <Paragraph>{formatAmount(liquidityValue1, false, 4)}</Paragraph>
            </div>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-1'>
                <CircleImage className='h-4 w-4' src={reward0?.token?.logoURI} alt='thena logo' />
                <Paragraph className='text-sm'>{reward0?.token?.symbol}</Paragraph>
              </div>
              <Paragraph>{formatAmount(reward0?.amount?.toSignificant(), false, 4)}</Paragraph>
            </div>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-1'>
                <CircleImage className='h-4 w-4' src={reward1?.token?.logoURI} alt='thena logo' />
                <Paragraph className='text-sm'>{reward1?.token?.symbol}</Paragraph>
              </div>
              <Paragraph>{formatAmount(reward1?.amount?.toSignificant(), false, 4)}</Paragraph>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter className='flex flex-col-reverse gap-4 lg:flex-row'>
        <TextButton className='w-full' onClick={() => setPopup(false)}>
          Cancel
        </TextButton>
        <PrimaryButton className='w-full' disabled={pending} onClick={() => onRemove()}>
          Remove
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  )
}
