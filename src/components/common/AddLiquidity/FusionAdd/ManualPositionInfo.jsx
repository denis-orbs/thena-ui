import BigNumber from 'bignumber.js'
import { useContext, useMemo, useState } from 'react'
import { Position } from 'thenafi-fusion-sdk'
import { useTranslations } from 'use-intl'

import { EmphasisButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import { ManualsContext } from '@/context/manualsContext'
import { useFarmPositions } from '@/hooks/position/useFarmPosition'
import { useManualPositions } from '@/hooks/position/useManualPosition'
import usePrevious from '@/hooks/usePrevious'
import { cn, formatAmount, fromWei, unwrappedSymbol } from '@/lib/utils'
import ClaimModal from '@/modules/Position/ClaimModal'
import RemoveManualModal from '@/modules/Position/RemoveManualModal'
import { InfoIcon } from '@/svgs'

export default function ManualPositionInfo({ baseCurrency, quoteCurrency, position, type }) {
  const t = useTranslations()
  const [claimPopup, setClaimPopup] = useState(false)
  const [removePopup, setRemovePopup] = useState(false)

  const { mutateManual } = useContext(ManualsContext)

  const farmingPos = useFarmPositions(type === 'CL_Farming' && position.pool ? [position.pool] : [])
  const manualPos = useManualPositions(type === 'CL_SwapFee' && position.pool ? [position.pool] : [])

  const _position = type === 'CL_Farming' ? farmingPos?.[0] : manualPos?.[0]

  const { liquidity, key: poolKey, tickLower, tickUpper, rewards, fusionState, fusion } = _position || {}
  const [prevFusionState, prevFusion] = usePrevious([fusionState, fusion]) || []
  const [reward0, reward1] = rewards || []

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

  return (
    <>
      <article
        className={cn(
          'max-lg:bg-chart-gradient flex flex-col items-start gap-4 rounded-lg border border-neutral-600 bg-neutral-900 px-4 py-4 font-medium lg:px-6',
        )}
      >
        <div className='flex w-full items-center justify-between'>
          <div className='flex flex-col justify-between gap-2'>
            <TextHeading className='font-archia !text-xl !leading-6 xl:font-semibold'>{t('Your Deposit')}</TextHeading>
            <Paragraph className='text-sm! font-normal! text-neutral-500'>${position.depositInUSD}</Paragraph>
          </div>
          <div className='flex w-fit gap-2'>
            <EmphasisButton
              className='leading-4 max-lg:h-8 max-lg:p-2! max-lg:text-sm!'
              onClick={() => setRemovePopup(true)}
            >
              {t('Remove')}
            </EmphasisButton>
            {position?.rewardUsd > 0 && (
              <EmphasisButton
                className='leading-4 max-lg:h-8 max-lg:p-2! max-lg:text-sm!'
                onClick={() => setClaimPopup(true)}
              >
                {t('Claim')}
              </EmphasisButton>
            )}
          </div>
        </div>
        <div className='flex w-full flex-row flex-wrap gap-4 lg:gap-6'>
          <div className='flex h-12 flex-1 flex-col gap-1 lg:justify-start'>
            <div className='flex items-center gap-2'>
              <CircleImage className='size-5' src={baseCurrency.logoURI ?? UNKNOWN_LOGO} alt='base token' />
              <Paragraph className='text-primary-50 font-archia text-xl! font-semibold'>
                {formatAmount(position.amountAsset0)}
              </Paragraph>
            </div>
            <Paragraph className='text-xs font-medium text-nowrap text-neutral-500 lg:text-sm'>
              {t('[symbol] deposit [percent]', {
                symbol: baseCurrency.symbol,
                percent: formatAmount(position.firstPercent),
              })}
            </Paragraph>
          </div>

          <div className='flex h-12 flex-1 flex-col gap-1'>
            <div className='flex items-center gap-2'>
              <CircleImage className='size-5' src={quoteCurrency.logoURI ?? UNKNOWN_LOGO} alt='quote token' />
              <Paragraph className='text-primary-50 font-archia text-xl! font-semibold'>
                {formatAmount(position.amountAsset1)}
              </Paragraph>
            </div>
            <Paragraph className='text-xs font-medium text-nowrap text-neutral-500 lg:text-sm'>
              {t('[symbol] deposit [percent]', {
                symbol: quoteCurrency.symbol,
                percent: formatAmount(100 - position.firstPercent),
              })}
            </Paragraph>
          </div>
          <div className='flex h-12 flex-1 flex-col gap-1'>
            <div className='flex items-center gap-2'>
              $
              <Paragraph className='text-primary-50 font-archia text-xl! font-semibold'>
                {formatAmount(position.rewardUsd)}
              </Paragraph>
              {position.rewardUsd > 0 &&
                (type === 'CL_Farming' ? (
                  <>
                    <InfoIcon className='h-4 w-4 stroke-neutral-400 max-xl:hidden' data-tooltip-id='net-reward' />
                    <CustomTooltip id='net-reward'>
                      <p className={cn(position.rewards && position.rewards[0] === 0n && 'hidden')}>
                        {`${formatAmount(fromWei(position.rewards?.[0] ?? 0n, 18))} THE`}
                      </p>
                      <p className={cn(position.rewards && position.rewards[1] === 0n && 'hidden')}>
                        {`${formatAmount(fromWei(position.rewards?.[1] ?? 0n, 18))} WBNB`}
                      </p>
                    </CustomTooltip>
                  </>
                ) : (
                  <>
                    <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id='net-reward' />
                    <CustomTooltip id='net-reward'>
                      <p>
                        {`${formatAmount(
                          fromWei(position?.fees[0], position.rewards[0]?.token?.decimals),
                        )} ${unwrappedSymbol(position?.rewards[0]?.token)}`}
                      </p>
                      <p>
                        {`${formatAmount(
                          fromWei(position?.fees[1], position.rewards[1]?.token?.decimals),
                        )} ${unwrappedSymbol(position?.rewards[1]?.token)}`}
                      </p>
                    </CustomTooltip>
                  </>
                ))}
            </div>
            <Paragraph className='text-xs font-medium text-nowrap text-neutral-500 lg:text-sm'>
              {t('Rewards')}
            </Paragraph>
          </div>
        </div>
      </article>
      {position?.rewardUsd > 0 && (
        <ClaimModal
          popup={claimPopup}
          setPopup={setClaimPopup}
          pool={position.pool}
          reward0={position.rewards[0]}
          reward1={position.rewards[1]}
          // mutate={refetchFarm}
          outOfRange={position.outOfRange}
          fee={position.fusion?.fee || 0}
        />
      )}

      {position.rewards && _position && (
        <RemoveManualModal
          popup={removePopup}
          setPopup={setRemovePopup}
          pool={type === 'CL_Farming' ? { ..._position, key: poolKey } : { _position }}
          position={_position2}
          reward0={type === 'CL_Farming' ? _position?.rewards[0] : reward0}
          reward1={type === 'CL_Farming' ? _position?.rewards[1] : reward1}
          mutateManual={mutateManual}
          outOfRange={position.outOfRange}
          fee={_fusion?.fee || 0}
        />
      )}
    </>
  )
}
