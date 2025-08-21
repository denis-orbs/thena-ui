import BigNumber from 'bignumber.js'
import { useContext, useMemo, useState } from 'react'
import { Position } from 'thenafi-fusion-sdk'
import { useTranslations } from 'use-intl'
import { zeroAddress } from 'viem'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import { Paragraph, TextHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import { ManualsContext } from '@/context/manualsContext'
import { useAlgebraEnterFarming } from '@/hooks/fusion/useAlgebra'
import { usePoolAlgebraInfo } from '@/hooks/fusion/usePoolAlgebraInfo'
import { useFarmPositions } from '@/hooks/position/useFarmPosition'
import { useManualPositions } from '@/hooks/position/useManualPosition'
import usePrevious from '@/hooks/usePrevious'
import { cn, formatAmount, fromWei } from '@/lib/utils'
import ClaimModal from '@/modules/Position/ClaimModal'
import RemoveManualModal from '@/modules/Position/RemoveManualModal'

export default function ManualPositionInfo({ baseCurrency, quoteCurrency, position, type }) {
  const t = useTranslations()
  const [claimPopup, setClaimPopup] = useState(false)
  const [removePopup, setRemovePopup] = useState(false)

  const { mutateManual } = useContext(ManualsContext)

  const farmingPos = useFarmPositions(type === 'CL_Farming' && position.pool ? [position.pool] : [])
  const manualPos = useManualPositions(type === 'CL_SwapFee' && position.pool ? [position.pool] : [])
  const { onEnterFarming, pending: isEnterFarmLoading } = useAlgebraEnterFarming()

  const { incentiveAddress } = usePoolAlgebraInfo(baseCurrency?.address, quoteCurrency?.address)
  const _position = useMemo(() => {
    if (type === 'CL_Farming') {
      return farmingPos?.[0]
    }
    if (type === 'CL_SwapFee') {
      return manualPos?.[0]
    }
    return undefined
  }, [farmingPos, manualPos, type])

  const { liquidity, key: poolKey, tickLower, tickUpper, rewards, fees, fusionState, fusion } = _position || {}
  const [prevFusionState, prevFusion] = usePrevious([fusionState, fusion]) || []
  const [reward0, reward1] = type === 'CL_Farming' ? rewards || [] : fees || []

  const [, _fusion] = useMemo(() => {
    if (!fusion && prevFusion && prevFusionState) {
      return [prevFusionState, prevFusion]
    }
    return [fusionState, fusion]
  }, [fusion, fusionState, prevFusion, prevFusionState])

  const _position2 = useMemo(() => {
    if (_fusion) {
      return new Position({
        pool: _fusion,
        liquidity: new BigNumber(liquidity).toString(10),
        tickLower,
        tickUpper,
      })
    }
    return undefined
  }, [liquidity, _fusion, tickLower, tickUpper])

  const ButtonsDisplay = useMemo(() => {
    const isLimbo = !(
      _position?.isFarming ||
      !incentiveAddress ||
      incentiveAddress === zeroAddress ||
      _position?.deployer !== zeroAddress ||
      Number(liquidity) <= 0
    )

    return (
      <div className='flex w-full gap-2'>
        <EmphasisButton className='max-xl:flex-1' onClick={() => setRemovePopup(true)}>
          {t('Withdraw')}
        </EmphasisButton>
        {/* earn $THE just display if position is Farming and not earning */}
        {isLimbo ? (
          <PrimaryButton
            className='max-xl:flex-1'
            disabled={isEnterFarmLoading}
            onClick={
              () =>
                onEnterFarming({ tokenId: position.tokenId, poolAddress: farmingPos?.[0]?.poolAddress }, () =>
                  mutateManual(),
                )
              // eslint-disable-next-line react/jsx-curly-newline
            }
          >
            {t('Earn $THE')}
          </PrimaryButton>
        ) : (
          <EmphasisButton className='max-xl:flex-1' onClick={() => setClaimPopup(true)}>
            {t('Claim')}
          </EmphasisButton>
        )}
      </div>
    )
  }, [
    t,
    _position?.isFarming,
    _position?.deployer,
    incentiveAddress,
    liquidity,
    isEnterFarmLoading,
    onEnterFarming,
    position.tokenId,
    farmingPos,
    mutateManual,
  ])

  return (
    <>
      <article
        className={cn(
          'bg-chart-gradient inline-flex w-full flex-col items-start gap-4 rounded-lg px-4 py-4 font-medium outline-1 outline-neutral-600',
          'xl:ml-auto xl:w-fit xl:self-start xl:px-6',
        )}
      >
        <div className='flex w-full flex-col gap-2 xl:flex-row xl:items-center xl:justify-between'>
          <div className='flex min-w-0 flex-row justify-between gap-4'>
            <div className='flex flex-col gap-2'>
              <TextHeading className='font-archia !text-xl !leading-6 xl:font-semibold'>
                {t('Your Position')}
              </TextHeading>
              <Paragraph className='text-sm! font-normal! text-neutral-500'>${position.depositInUSD}</Paragraph>
            </div>

            {/* APR (mobile) */}
            <div className='flex flex-col justify-between gap-2 xl:hidden'>
              <Paragraph className='font-archia text-primary-600 text-xl! leading-6! font-semibold text-nowrap'>
                {formatAmount(position?.apr)}%
              </Paragraph>
              <Paragraph className='text-sm! font-medium text-nowrap text-neutral-500'>{t('APR')}</Paragraph>
            </div>
          </div>
          <div className='flex w-full shrink-0 gap-2 max-xl:hidden xl:w-auto xl:justify-end'>{ButtonsDisplay}</div>
        </div>
        <div className='flex w-full flex-row flex-wrap gap-4 xl:gap-6'>
          <div className='flex h-12 flex-1 flex-col gap-1 xl:justify-start'>
            <div className='flex items-center gap-2'>
              <CircleImage className='size-5' src={baseCurrency.logoURI ?? UNKNOWN_LOGO} alt='base token' />
              <Paragraph className='text-primary-50 font-archia text-xl! leading-6! font-semibold'>
                {formatAmount(position.amountAsset0)}
              </Paragraph>
            </div>
            <Paragraph className='text-xs font-medium text-nowrap text-neutral-500 xl:text-sm'>
              {t('[symbol] deposit [percent]', {
                symbol: baseCurrency.symbol,
                percent: formatAmount(position.firstPercent),
              })}
            </Paragraph>
          </div>

          <div className='flex h-12 flex-1 flex-col gap-1'>
            <div className='flex items-center gap-2'>
              <CircleImage className='size-5' src={quoteCurrency.logoURI ?? UNKNOWN_LOGO} alt='quote token' />
              <Paragraph className='text-primary-50 font-archia text-xl! leading-6! font-semibold'>
                {formatAmount(position.amountAsset1)}
              </Paragraph>
            </div>
            <Paragraph className='text-xs font-medium text-nowrap text-neutral-500 xl:text-sm'>
              {t('[symbol] deposit [percent]', {
                symbol: quoteCurrency.symbol,
                percent: formatAmount(100 - position.firstPercent),
              })}
            </Paragraph>
          </div>
          <div className='flex h-12 flex-1 flex-col gap-1'>
            <div className='flex items-center gap-2'>
              {position.rewardUsd > 0 &&
                (type === 'CL_Farming' ? (
                  <>
                    <div className='flex flex-nowrap items-center gap-2'>
                      <CircleImage className='size-5' src='https://cdn.thena.fi/assets/THE.png' alt='reward THE' />
                      <Paragraph className='text-primary-50 font-archia text-xl! leading-6! font-semibold text-nowrap'>
                        {formatAmount(reward0?.amount?.toSignificant())}
                      </Paragraph>
                    </div>
                    <div className='flex flex-nowrap items-center gap-2'>
                      <CircleImage className='size-5' src='https://cdn.thena.fi/assets/WBNB.png' alt='reward BNB' />
                      <Paragraph className='text-primary-50 font-archia text-xl! leading-6! font-semibold text-nowrap'>
                        {formatAmount(reward1?.amount?.toSignificant())}
                      </Paragraph>
                    </div>
                  </>
                ) : (
                  <>
                    <div className='flex flex-nowrap items-center gap-2'>
                      <CircleImage
                        className='size-5'
                        src={position?.rewards?.[0]?.token?.logoURI || UNKNOWN_LOGO}
                        alt='reward 0'
                      />
                      <Paragraph className='text-primary-50 font-archia text-xl! leading-6! font-semibold text-nowrap'>
                        {formatAmount(fromWei(reward0))}
                      </Paragraph>
                    </div>
                    <div className='flex flex-nowrap items-center gap-2'>
                      <CircleImage
                        className='size-5'
                        src={position?.rewards?.[1]?.token?.logoURI || UNKNOWN_LOGO}
                        alt='reward 1'
                      />
                      <Paragraph className='text-primary-50 font-archia text-xl! leading-6! font-semibold text-nowrap'>
                        {formatAmount(fromWei(reward1))}
                      </Paragraph>
                    </div>
                  </>
                ))}
            </div>
            <Paragraph className='text-xs font-medium text-nowrap text-neutral-500 xl:text-sm'>
              {t('Rewards')}
            </Paragraph>
          </div>
          <div className='flex h-12 flex-1 flex-col gap-1 max-xl:hidden'>
            <Paragraph className='font-archia text-primary-600 text-xl! font-semibold text-nowrap'>
              {formatAmount(position.apr)}%
            </Paragraph>
            <Paragraph className='text-xs font-medium text-nowrap text-neutral-500 xl:text-sm'>{t('APR')}</Paragraph>
          </div>
        </div>
        <div className='flex w-full shrink-0 gap-2 xl:hidden xl:w-auto'>{ButtonsDisplay}</div>
      </article>
      {position?.rewardUsd > 0 && (
        <ClaimModal
          popup={claimPopup}
          setPopup={setClaimPopup}
          pool={type === 'CL_Farming' ? { ..._position, key: poolKey } : _position}
          reward0={reward0}
          reward1={reward1}
          // mutate={refetchFarm}
          outOfRange={position.outOfRange}
          fee={position.fusion?.fee || 0}
        />
      )}

      {position.rewards && _position && (
        <RemoveManualModal
          popup={removePopup}
          setPopup={setRemovePopup}
          pool={type === 'CL_Farming' ? { ..._position, key: poolKey } : _position}
          position={_position2}
          reward0={reward0}
          reward1={reward1}
          mutateManual={mutateManual}
          outOfRange={position.outOfRange}
          fee={_fusion?.fee || 0}
        />
      )}
    </>
  )
}
