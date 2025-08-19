import { AnimatePresence, motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import PositionInfo from '@/components/common/AddLiquidity/FusionAdd/LiquidityChartRangeInput/PositionInfo'
import V1Add from '@/components/common/AddLiquidity/V1Add'
import NewIconGroup from '@/components/icongroup/NewIconGroup'
import { NewTextHeading, NewTextSubHeading, Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { useVaults } from '@/context/vaultsContext'
import { useGetAsset } from '@/hooks/fusion/Tokens'
import { useNotStakedPositions } from '@/hooks/position/useNotStakedPosition'
import { useStakedPosition } from '@/hooks/position/useStakedPosition'
import { cn } from '@/lib/utils'
import { usePools } from '@/state/pools/hooks'
import { InfoIcon } from '@/svgs'

import { PairBasicInfo } from './PairBasicInfo'
import { PoolAttributesSection } from './PoolAttributesSection'
import { PoolReserveSection } from './PoolReserveSection'

function PoolInfo({ pair, pool, showAttributes = true }) {
  return (
    <div className='flex flex-col gap-0 xl:order-2 xl:gap-4'>
      {showAttributes && (
        <div className='hidden w-full xl:block'>
          <PoolAttributesSection pair={pair} className='w-full' />
        </div>
      )}

      <div className='order-1 xl:order-2'>
        <PoolReserveSection pool={pool} className='hidden xl:block' showMyInfo={false} />
      </div>
    </div>
  )
}

function AddLiquidityV1Pool({ pair, handleBack }) {
  const t = useTranslations()
  const searchParams = useSearchParams()

  const pools = usePools()
  const vaults = useVaults()
  const userPools = useMemo(() => [...pools, ...vaults].filter(item => item.account.totalLp.gt(0)), [pools, vaults])
  const _userPools = useMemo(
    () => userPools.filter(item => item.address.toLowerCase() === pair?.address.toLowerCase()),
    [pair, userPools],
  )

  const isManage = useMemo(
    () => searchParams.get('back') === '2' && _userPools.length > 0,
    [_userPools.length, searchParams],
  )

  const isStaked = searchParams.get('staked') === 'true'

  const userStakedPosition = useStakedPosition(isStaked ? _userPools : [])

  const userNotStakedPosition = useNotStakedPositions(!isStaked ? _userPools : [])

  const pairType = pair?.type ?? searchParams.get('pairType')

  const [firstAddress, setFirstAddress] = useState(pair?.token0?.address ?? searchParams.get('firstAddress'))
  const [secondAddress, setSecondAddress] = useState(pair?.token1?.address ?? searchParams.get('secondAddress'))
  const [showReserve, setShowReserve] = useState(false)

  const firstAsset = useGetAsset(firstAddress)
  const secondAsset = useGetAsset(secondAddress)

  // If there is only poolv2, then use it
  const pool = useMemo(() => {
    if (!pair?.subpools?.length) return undefined
    return pair.subpools.length > 1 ? pair.subpools.find(item => item.version === 3) : pair.subpools[0]
  }, [pair])

  return (
    <div className='flex flex-col'>
      <div className='flex flex-col gap-4 xl:flex-row xl:gap-8'>
        {/* Left side */}
        <div className={cn('order-1 flex flex-col gap-4', isManage ? 'flex-[4]' : 'flex-[6]')}>
          <div className='flex flex-col gap-2'>
            <div className='flex flex-row items-center gap-2 xl:gap-8'>
              <NewIconGroup
                logo1={(pair ? pair?.token0?.logoURI : firstAsset?.logoURI) ?? UNKNOWN_LOGO}
                logo2={(pair ? pair?.token1?.logoURI : secondAsset?.logoURI) ?? UNKNOWN_LOGO}
              />
              <NewTextHeading className='text-xl! leading-6! text-neutral-50 lg:text-[36px]! lg:leading-[40px]!'>
                {`${
                  (pair ? pair?.token0?.symbol : firstAsset?.symbol) === 'WBNB'
                    ? 'BNB'
                    : pair
                      ? pair?.token0?.symbol
                      : firstAsset?.symbol
                }/${
                  (pair ? pair?.token1?.symbol : secondAsset?.symbol) === 'WBNB'
                    ? 'BNB'
                    : pair
                      ? pair?.token1?.symbol
                      : secondAsset?.symbol
                }`}
              </NewTextHeading>
            </div>
            <div className='flex w-full flex-col gap-2'>
              <div className='flex justify-between'>
                <TextHeading className='text-2xl font-medium text-neutral-50'>
                  {t((pair?.type || pairType) === PAIR_TYPES.STABLE ? 'Stable' : 'Classic')}
                </TextHeading>
                <div className='flex flex-col items-center xl:hidden'>
                  <i
                    onClick={() => setShowReserve(show => !show)}
                    className={cn(
                      'flex cursor-pointer items-center justify-center rounded-lg',
                      'size-8 min-w-8 md:size-11 md:min-w-11',
                      showReserve ? 'bg-neutral-600' : 'bg-neutral-900',
                    )}
                  >
                    <InfoIcon className='size-4 stroke-neutral-400 md:size-5' />
                  </i>
                </div>
              </div>
              <AnimatePresence mode='wait'>
                {showReserve && (
                  <motion.div
                    key={pool ? 'pool' : 'new-deposit'}
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className='overflow-hidden xl:hidden'
                  >
                    {!pool ? (
                      <div className='mt-2 flex h-max flex-col gap-2 rounded-md bg-neutral-800 p-4'>
                        <NewTextSubHeading className='font-archia text-xl!'>{t('New Deposit')}</NewTextSubHeading>
                        <Paragraph className='text-neutral-400'>{t('New Deposit description')}</Paragraph>
                      </div>
                    ) : (
                      <PoolReserveSection pool={pool} className='mb-4 block xl:hidden' showMyInfo={!isManage} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          {pair && (
            <>
              <div className={cn('flex flex-col gap-2 md:gap-4 xl:gap-8', isManage ? 'xl:mt-1 xl:gap-0' : 'xl:gap-8')}>
                <div className={cn(isManage ? 'xl:order-2 xl:mt-[1px]' : 'xl:order-1')}>
                  <PairBasicInfo
                    pair={pair}
                    etApr={!isManage}
                    useSolidBg
                    classNames={{
                      title: 'xl:text-xl! text-xl! xl:leading-6! leading-6! font-archia font-semibold',
                      subtitle: 'text-sm! text-neutral-300 xl:text-base!',
                      container: 'gap-1',
                      box: 'bg-neutral-900! ',
                    }}
                  />
                </div>
                <div className={cn('hidden max-xl:block', isManage ? 'block! xl:order-1 xl:mb-6' : 'xl:order-2')}>
                  <PoolAttributesSection pair={pair} className='w-full' />
                </div>
              </div>
              {isManage && (
                <div className='hidden xl:block'>
                  <PoolInfo pair={pair} pool={pool} showReserve={showReserve} showAttributes={false} />
                </div>
              )}
            </>
          )}

          {/* New deposit if no user pool (user has no LP in this pool) */}
          {!isManage && (
            <V1Add
              pool={pool}
              pairType={pair?.type || pairType}
              firstAsset={firstAsset}
              secondAsset={secondAsset}
              setFirstAddress={setFirstAddress}
              setSecondAddress={setSecondAddress}
              handleBack={handleBack}
            />
          )}
        </div>

        {/* Right side */}
        <div
          className={cn(
            'order-2 flex flex-col gap-6',
            isManage ? 'flex-[6]' : 'flex-[4] xl:pt-[104px]',
            !pool && 'xl:pt-[88px]',
          )}
        >
          {!pair && (
            <div className='mt-4 hidden h-max flex-col gap-2 rounded-md bg-neutral-800 p-4 xl:flex'>
              <NewTextSubHeading className='font-archia text-xl!'>{t('New Deposit')}</NewTextSubHeading>
              <Paragraph className='text-neutral-400'>{t('New Deposit description')}</Paragraph>
            </div>
          )}

          {isManage && (
            <>
              <PositionInfo
                position={isStaked ? userStakedPosition[0] : userNotStakedPosition[0]}
                isStaked={isStaked}
              />
              {/* deposit to existing position */}
              <V1Add
                pool={pool}
                pairType={pair?.type || pairType}
                firstAsset={firstAsset}
                secondAsset={secondAsset}
                setFirstAddress={setFirstAddress}
                setSecondAddress={setSecondAddress}
                handleBack={handleBack}
              />
            </>
          )}
          {pool && !isManage && <PoolInfo pair={pair} pool={pool} showReserve={showReserve} />}
        </div>
      </div>
    </div>
  )
}

export default AddLiquidityV1Pool
