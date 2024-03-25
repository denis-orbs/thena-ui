'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { Percent } from 'thena-sdk-core'

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

export default function RemoveManualModal({
  popup,
  setPopup,
  pool,
  position,
  feeValue0,
  feeValue1,
  mutateManual,
  outOfRange,
  fee,
}) {
  const [percent, setPercent] = useState(0)
  const debouncedPercent = useDebounce(percent)
  const { slippage, deadline } = useSettings()
  const liquidityPercentage = useMemo(() => new Percent(percent, 100), [percent])
  const { pending, onAlgebraRemove } = useAlgebraRemove()

  const liquidityValue0 = useMemo(() => ((position?.amount0.toExact() || 0) * percent) / 100, [position, percent])
  const liquidityValue1 = useMemo(() => ((position?.amount1.toExact() || 0) * percent) / 100, [position, percent])

  const onRemove = useCallback(() => {
    if (debouncedPercent > 0) {
      onAlgebraRemove(pool.tokenId, position, liquidityPercentage, feeValue0, feeValue1, slippage, deadline, () => {
        setPercent(0)
        setPopup(false)
        mutateManual()
      })
    } else {
      warnToast('Invalid Amount', 'warn')
    }
  }, [
    pool,
    position,
    liquidityPercentage,
    feeValue0,
    feeValue1,
    debouncedPercent,
    deadline,
    slippage,
    onAlgebraRemove,
    setPopup,
    mutateManual,
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
              logo1={pool.asset0.logoURI}
              logo2={pool.asset1.logoURI}
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
        <div className='flex flex-col gap-4'>
          <CustomSlider percent={percent} onPercentChange={setPercent} />
          <TextHeading>You will receive</TextHeading>
          <div className='flex flex-col gap-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-1'>
                <CircleImage className='h-4 w-4' src={pool.asset0.logoURI} alt='thena logo' />
                <Paragraph className='text-sm'>Pooled {pool.asset0.symbol}</Paragraph>
              </div>
              <Paragraph>{formatAmount(liquidityValue0, false, 4)}</Paragraph>
            </div>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-1'>
                <CircleImage className='h-4 w-4' src={pool.asset1.logoURI} alt='thena logo' />
                <Paragraph className='text-sm'>Pooled {pool.asset1.symbol}</Paragraph>
              </div>
              <Paragraph>{formatAmount(liquidityValue1, false, 4)}</Paragraph>
            </div>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-1'>
                <CircleImage className='h-4 w-4' src={pool.asset0.logoURI} alt='thena logo' />
                <Paragraph className='text-sm'>{pool.asset0.symbol} Fee Earned</Paragraph>
              </div>
              <Paragraph>{formatAmount(feeValue0?.toSignificant(), false, 4)}</Paragraph>
            </div>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-1'>
                <CircleImage className='h-4 w-4' src={pool.asset1.logoURI} alt='thena logo' />
                <Paragraph className='text-sm'>{pool.asset1.symbol} Fee Earned</Paragraph>
              </div>
              <Paragraph>{formatAmount(feeValue1?.toSignificant(), false, 4)}</Paragraph>
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
