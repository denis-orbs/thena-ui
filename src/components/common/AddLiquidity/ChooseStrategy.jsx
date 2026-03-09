'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useState } from 'react'
import { zeroAddress } from 'viem'

import { useGaugeAlive } from '@/app/pools/(add-liquidity)/add-liquidity/ClPool'
import Selection from '@/components/selection'
import Toggle from '@/components/toggle'
import { NewTextSubHeading, Paragraph } from '@/components/typography'
import InfoIcon from '@/icons/InfoIcon'
import cn from '@/utils/classes'
import { ZERO_VALUE } from '@/utils/utils'

export const defaultSwapFees = {
  isDefault: false,
  address: zeroAddress,
  tvl: ZERO_VALUE,
  totalSupply: 0,
  lpPrice: 0,
  type: 'Conc Liquidity',
  gauge: {
    apr: ZERO_VALUE,
    voteApr: ZERO_VALUE,
    totalSupply: 0,
    address: zeroAddress,
    fee: zeroAddress,
    bribe: zeroAddress,
    weight: ZERO_VALUE,
    weightPercent: ZERO_VALUE,
    bribes: {
      fee: null,
      bribe: null,
    },
    isAlive: false,
    tvl: ZERO_VALUE,
    bribeUsd: ZERO_VALUE,
    pooled0: ZERO_VALUE,
    pooled1: ZERO_VALUE,
  },
  allowed: {},
  stable: false,
  isAutomatic: false,
  title: 'CL_SwapFee',
  account: {
    walletBalance: ZERO_VALUE,
    gaugeBalance: ZERO_VALUE,
    gaugeEarned: ZERO_VALUE,
    totalLp: ZERO_VALUE,
    token0claimable: ZERO_VALUE,
    token1claimable: ZERO_VALUE,
    staked0: ZERO_VALUE,
    staked1: ZERO_VALUE,
    stakedUsd: ZERO_VALUE,
    earnedUsd: ZERO_VALUE,
    total0: ZERO_VALUE,
    total1: ZERO_VALUE,
    totalUsd: ZERO_VALUE,
  },
}

export function StrategyTitle({
  isAutomatic,
  strategyCount,
  toggleStrategyType,
  pair,
  handleChooseStrategy,
  firstAsset,
  secondAsset,
  strategy,
}) {
  const [show, setShow] = useState(false)
  const t = useTranslations()

  const strategyType = useMemo(
    () => [
      {
        label: t('Manual'),
        active: !isAutomatic,
        onClickHandler: () => {
          toggleStrategyType(false)
        },
      },
      {
        label: t('Automated'),
        active: isAutomatic,
        onClickHandler: () => {
          toggleStrategyType(true)
        },
      },
    ],
    [isAutomatic, toggleStrategyType, t],
  )

  const isGaugeAlive = useGaugeAlive(pair?.address)
  const hasFarming = useMemo(
    () => pair?.subpools?.some(pool => pool.title === 'CL_Farming' && isGaugeAlive),
    [pair?.subpools, isGaugeAlive],
  )
  const hasSwapFee = useMemo(() => pair?.subpools?.some(pool => pool.title === 'CL_SwapFee'), [pair?.subpools])
  const showToggle = useMemo(() => firstAsset && secondAsset, [firstAsset, secondAsset])
  const hasToggle = useMemo(() => hasSwapFee && hasFarming && !isAutomatic, [hasFarming, hasSwapFee, isAutomatic])

  const handleChangeManualType = useCallback(
    event => {
      if (strategy) {
        // event.target.checked=true means "Earn Fees" (not farming)
        // event.target.checked=false means "Earn THE" (farming)
        const isToggleChecked = event.target.checked
        const shouldBeFarming = !isToggleChecked
        const _strategy = pair?.subpools.find(item =>
          shouldBeFarming ? item.title === 'CL_Farming' : item.title === 'CL_SwapFee',
        )
        handleChooseStrategy(_strategy ?? defaultSwapFees)
      }
    },
    [handleChooseStrategy, pair?.subpools, strategy],
  )

  return (
    <article className={cn(strategyCount === 0 && !hasToggle && 'hidden')}>
      <div className={cn('flex flex-col items-start gap-4 md:flex-row md:items-center')}>
        <div className={cn('flex items-center gap-2 max-md:w-full', strategyCount === 0 && 'hidden')}>
          <Selection
            className='w-full max-md:grid max-md:grid-cols-2 md:w-[278px] [&>button]:h-full [&>button]:font-medium'
            data={strategyType}
            isTranslation={false}
            classNames={{
              items: 'md:w-1/2',
            }}
          />
          <i
            onClick={() => setShow(!show)}
            className={cn(
              'flex cursor-pointer items-center justify-center rounded-lg',
              'size-8 min-w-8 md:size-11 md:min-w-11',
              show ? 'bg-neutral-600' : 'bg-neutral-900',
            )}
          >
            <InfoIcon className='md:size-5' />
          </i>
        </div>
        <div className={cn(!hasToggle && 'hidden')}>
          <Toggle
            checked={!strategy?.isFarming}
            onChange={handleChangeManualType}
            label='Earn Fees'
            className={cn('mt-0! [&>span]:text-base', showToggle ? '' : 'hidden')}
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 0, height: 0 }}
        animate={show ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: 0, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className='h-full overflow-hidden'
      >
        <div className={cn('mt-2 rounded-lg bg-neutral-900 p-4 pt-5')}>
          <Paragraph className='mb-4 block text-base'>
            {t('Depending on the Assets you chose, you will get different Strategies to chose on')}
          </Paragraph>

          <NewTextSubHeading className='text-5! mb-2 block leading-6! font-semibold xl:text-[18px] xl:leading-7!'>
            {t('Manual Strategy')}
          </NewTextSubHeading>
          <Paragraph className='text-[16px] leading-[20px]'>
            {t('Only use if you are experienced in providing concentrated liquidity')}
          </Paragraph>

          <NewTextSubHeading className='text-5! my-2 block leading-6! font-semibold xl:text-[18px] xl:leading-7!'>
            {t('Automatic Strategy')}
          </NewTextSubHeading>
          <Paragraph className='text-base'>{t('If you are new to concentrated liquidity')}</Paragraph>
        </div>
      </motion.div>
    </article>
  )
}
