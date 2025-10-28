import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import { useCallback, useMemo, useState } from 'react'
import { zeroAddress } from 'viem'

import RemoveWeightedModal from '@/app/pools/RemoveWeightedModal'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import CustomTooltip from '@/components/tooltip'
import { NewTextSubHeading, Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import {
  useClaimWeightedPoolFees,
  useGaugeBalance,
  useGaugeHarvestWeighted,
  useGaugeStakeWeighted,
  useGaugeUnstakeWeighted,
  useWithdrawUserBalanceWeighted,
} from '@/hooks/weightedPool/useWeigtedPool'
import { formatAmount, fromWei, isInvalidAmount } from '@/lib/utils'
import GaugeWeightedManageModal from '@/modules/Position/GaugeWeightedManageModal'
import RemoveWeightedPositionModal from '@/modules/Position/ManageWeightedPositionModal'
import { InfoIcon } from '@/svgs'

import WeightedRange from './WeightedRange'

function WeightedItem({ position, isStake, isXlDown }) {
  const t = useTranslations()
  const { push } = useRouter()

  const [isOpenRemove, setIsOpenRemove] = useState(false)
  const [managePopup, setManagePopup] = useState(false)
  const [popupStake, setPopupStake] = useState(false)

  const { onGaugeStake, pending: stakePending } = useGaugeStakeWeighted()
  const { onClaimFees, pending: pendingClaimFees } = useClaimWeightedPoolFees()
  const { onGaugeHarvest, pending: pendingHarvest } = useGaugeHarvestWeighted()
  const { gaugeBalance } = useGaugeBalance(position.gauge.address)
  const { onGaugeUnstake, pending: unstakePending } = useGaugeUnstakeWeighted(gaugeBalance)
  const { onWithdrawUserBalance, pending: withdrawPending } = useWithdrawUserBalanceWeighted()

  const { claimableFee, depositValue } = position

  const onClaim = useCallback(
    () =>
      onClaimFees(position, () => {
        // mutatePosition()
      }),
    [onClaimFees, position],
  )

  // Render reward token list once to avoid repetition
  const renderRewardTokens = useMemo(() => {
    const tokenList = claimableFee?.tokenList || []
    const hasInvalidAmounts = tokenList.every(item => isInvalidAmount(item?.fee))

    return tokenList.map((reward, index) => {
      const displayName = reward?.name === 'Wrapped BNB' ? 'WBNB' : reward?.symbol || 'UNKNOWN'

      if (hasInvalidAmounts || !isInvalidAmount(reward?.fee)) {
        return <p key={`${reward.address}-${index}`}>{`${formatAmount(reward?.fee)} ${displayName}`}</p>
      }
      return null
    })
  }, [claimableFee?.tokenList])

  const renderTokenValue = useMemo(() => {
    const tokenList = depositValue?.tokens || []
    const hasInvalidAmounts = tokenList.every(item => isInvalidAmount(item?.amount))

    return tokenList.map((token, index) => {
      const displayName = token?.name === 'Wrapped BNB' ? 'WBNB' : token?.symbol || 'UNKNOWN'
      if (hasInvalidAmounts || !isInvalidAmount(token?.amount)) {
        return <p key={`${token.address}-${index}`}>{`${formatAmount(fromWei(token?.amount))} ${displayName}`}</p>
      }
      return null
    })
  }, [depositValue?.tokens])

  // Cell components memoized for performance
  const pairCell = useMemo(
    () => (
      <div className='flex w-full items-center gap-2'>
        <GroupIconTokens
          classNames={{
            image: 'outline-2 w-7 h-7',
            rows: '*:not-first:-ml-2',
            toolTip: 'hidden',
          }}
          width={32}
          height={32}
          tokens={position.tokens}
        />
        <div className='flex justify-between max-xl:w-full max-xl:items-center xl:flex-col'>
          <Link href={`/analytics/pairs/${position.address}?back=2`}>
            <NewTextSubHeading className='text-xl font-semibold md:text-xl'>{position.symbol}</NewTextSubHeading>
          </Link>
          <Paragraph className='text-lg font-medium text-neutral-500 md:text-lg xl:text-xs xl:text-neutral-300'>
            Weighted
          </Paragraph>
        </div>
      </div>
    ),
    [position.tokens, position.symbol, position.address],
  )

  const rangeCell = useMemo(() => <WeightedRange weighted={position} />, [position])

  const aprCell = useMemo(
    () => (
      <div className='flex flex-col max-xl:flex-1'>
        <TextHeading>{position.apr}%</TextHeading>
        <TextSubHeading className='font-medium xl:text-base'>{t('APR')}</TextSubHeading>
      </div>
    ),
    [position.apr, t],
  )

  const valueCell = useMemo(
    () => (
      <div className='flex flex-col max-xl:flex-1 max-xl:items-center max-xl:justify-center'>
        <div className='flex items-center gap-1 max-xl:justify-end'>
          <TextHeading>${formatAmount(depositValue.depositUsd)}</TextHeading>
          <InfoIcon
            className='h-4 w-4 stroke-neutral-400'
            data-tooltip-id={`value-${position?.address}-${isStake ? 'stake' : 'unstake'}`}
          />
          <CustomTooltip id={`value-${position?.address}-${isStake ? 'stake' : 'unstake'}`}>
            {renderTokenValue}
          </CustomTooltip>
        </div>

        <TextSubHeading className='font-medium xl:text-base'>{t('Value')}</TextSubHeading>
      </div>
    ),
    [depositValue.depositUsd, isStake, position?.address, renderTokenValue, t],
  )

  const rewardsCell = useMemo(
    () => (
      <div className='flex flex-col max-xl:flex-1'>
        <div className='flex items-center gap-1 max-xl:justify-end'>
          <span>${formatAmount(claimableFee?.total)}</span>
          <InfoIcon
            className='h-4 w-4 stroke-neutral-400'
            data-tooltip-id={`net-${position?.address}-${isStake ? 'stake' : 'unstake'}`}
          />
          <CustomTooltip id={`net-${position?.address}-${isStake ? 'stake' : 'unstake'}`}>
            {renderRewardTokens}
          </CustomTooltip>
        </div>
        <TextSubHeading className='font-medium max-xl:text-end xl:text-base'>{t('Reward')}</TextSubHeading>
      </div>
    ),
    [claimableFee?.total, position?.address, isStake, t, renderRewardTokens],
  )

  const actionCell = useMemo(() => {
    const disableActions = true // TODO: temporary disable all actions
    if (disableActions) {
      return (
        <div className='grid w-full grid-cols-1 justify-center gap-2'>
          <EmphasisButton disabled={withdrawPending} className='flex-1 px-1' onClick={() => onWithdrawUserBalance()}>
            {t('Withdraw')}
          </EmphasisButton>
        </div>
      )
    }
    return (
      <div className='grid w-full grid-cols-3 justify-center gap-2'>
        {isStake ? (
          <>
            <EmphasisButton disabled={unstakePending} className='flex-1 px-1' onClick={() => setPopupStake(true)}>
              {t('Unstake')}
            </EmphasisButton>

            <EmphasisButton
              className='flex-1 px-1'
              disabled={pendingHarvest || isInvalidAmount(claimableFee?.total)}
              onClick={() => onGaugeHarvest(position)}
            >
              {t('Claim')}
            </EmphasisButton>

            <EmphasisButton
              className='flex-1 px-1'
              onClick={() => push(`/pools/add-liquidity/weighted/${position.address}?back=2`)}
            >
              {t('Add')}
            </EmphasisButton>
          </>
        ) : (
          <>
            <EmphasisButton
              disabled={pendingClaimFees || isInvalidAmount(claimableFee.total)}
              onClick={onClaim}
              className='h-11 flex-1 px-1'
            >
              {t('Claim')}
            </EmphasisButton>

            <EmphasisButton className='h-11 flex-1 px-1' onClick={() => setManagePopup(true)}>
              {t('Manage')}
            </EmphasisButton>

            <PrimaryButton
              disabled={stakePending || position.gauge.address === zeroAddress}
              className='h-11 flex-1 px-1'
              onClick={() => setPopupStake(true)}
              data-tooltip-id={`stake-position-${position.address}`}
            >
              {t('Stake')}
            </PrimaryButton>

            {position.gauge.address === zeroAddress && (
              <CustomTooltip id={`stake-position-${position.address}`} className='max-w-[500px]'>
                {t('This pool has no Gauge')}
              </CustomTooltip>
            )}
          </>
        )}
      </div>
    )
  }, [
    claimableFee.total,
    isStake,
    onClaim,
    onGaugeHarvest,
    onWithdrawUserBalance,
    pendingClaimFees,
    pendingHarvest,
    position,
    push,
    stakePending,
    t,
    unstakePending,
    withdrawPending,
  ])

  return (
    <>
      {!isXlDown ? (
        <>
          <td className='rounded-l-md pl-4!'>{pairCell}</td>
          <td>{rangeCell}</td>
          <td>{aprCell}</td>
          <td>{valueCell}</td>
          <td>{rewardsCell}</td>
          <td className='rounded-r-md pr-4!'>{actionCell}</td>
        </>
      ) : (
        <div className='flex flex-col gap-4 py-4'>
          {pairCell}
          {rangeCell}
          <div className='flex w-full gap-2'>
            {aprCell}
            {valueCell}
            {rewardsCell}
          </div>
          {actionCell}
        </div>
      )}

      {isOpenRemove && <RemoveWeightedModal isOpen={isOpenRemove} pool={position} setIsOpen={setIsOpenRemove} />}
      {managePopup && <RemoveWeightedPositionModal popup={managePopup} setPopup={setManagePopup} pool={position} />}
      <GaugeWeightedManageModal
        title={!isStake ? 'Stake LP' : 'Unstake LP'}
        onGaugeManage={!isStake ? onGaugeStake : onGaugeUnstake}
        pending={false}
        pool={position}
        popup={popupStake}
        setPopup={setPopupStake}
        label={!isStake ? 'Stake' : 'Unstake'}
        isStake={isStake}
      />
    </>
  )
}

export default WeightedItem
