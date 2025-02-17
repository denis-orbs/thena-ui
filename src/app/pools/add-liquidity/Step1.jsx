import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'

import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import IconGroup from '@/components/icongroup'
import SelectorGrid from '@/components/selector/SelectorGrid'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { useGetAsset } from '@/hooks/fusion/Tokens'
import SelectPair from '@/modules/Pools/SelectPair'
import { InfoCircleWhite, PoolGroupIcon } from '@/svgs'

// const mockWeightedPool = {
//   isFusion: true,
//   fee: 0.01,
//   tvlUSD: 2,
//   dayFees: 4,
//   weekFees: 0.2,
//   dayVolume: 1,
//   weekVolume: 4,
//   reserve0: 0.9999999999999997,
//   reserve1: 0.0002043617060788,
//   token0: {
//     address: '0x8fe83aff545f583e0968ce3edd05cd8e1f83b14e',
//     symbol: 'ETH',
//     derived: '0',
//     logoURI: 'https://cdn.thena.fi/assets/ETH.png',
//   },
//   token0Derived: '0',
//   token1: {
//     address: '0xec7ef2340ca18d268c3f564af2f24587f7d399ba',
//     symbol: 'BNB',
//     derived: '0',
//     logoURI: 'https://cdn.thena.fi/assets/WBNB.png',
//   },
//   token1Derived: '0',
//   isStable: null,
//   type: 'Weighted',
//   symbol: 'ETH/BNB',
//   apr: '0%',
//   lowApr: 0,
//   highApr: 0,
//   subpools: [],
// }

// function PoolItem({ pool, onDeposit, isAdd = false }) {
//   const t = useTranslations()
//   return (
//     <div className='flex flex-col justify-between rounded-lg bg-neutral-900 p-3 lg:flex-row lg:items-center lg:p-4'>
//       <div className='mb-[10px] flex flex-col justify-between gap-3 lg:mb-0 lg:flex-row'>
//         <div className='flex flex-col gap-4 lg:flex-row'>
//           {pool.type !== PAIR_TYPES.WEIGHTED ? (
//             <div className='flex flex-row gap-2 lg:min-w-[496px]'>
//               <IconGroup
//                 className='-space-x-3'
//                 classNames={{
//                   image: 'outline-[2.6px] w-6 h-6',
//                 }}
//                 logo1={pool?.token0?.logoURI || UNKNOWN_LOGO}
//                 logo2={pool?.token1?.logoURI || UNKNOWN_LOGO}
//               />
//               <div className='flex flex-col'>
//                 <TextHeading className='text-sm lg:text-base'>{pool.symbol}</TextHeading>
//                 <Paragraph className='text-nowrap text-sm lg:text-base'>{getPoolType(pool?.type)}</Paragraph>
//               </div>
//             </div>
//           ) : (
//             <div className='grid grid-cols-1 gap-4 lg:min-w-[496px] lg:grid-cols-2'>
//               <div className='grid grid-cols-2 gap-3'>
//                 {(pool.tokens || []).map(token => (
//                   <div className='flex flex-row items-center gap-[6px]' key={token?.address}>
//                     <CircleImage
//                       className='z-1 h-6 w-6 rounded-full'
//                       src={token?.logoURI || UNKNOWN_LOGO}
//                       alt='THENA First Logo'
//                     />
//                     <span>{token?.symbol === 'WBNB' ? 'BNB' : token?.symbol || 'UNKNOWN'}</span>
//                     <Paragraph>{token.weight}%</Paragraph>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//           <hr className='mb-[10px] border border-neutral-700 lg:hidden' />
//           {!isAdd && (
//             <div className='grid grid-cols-2'>
//               <div className='flex flex-col lg:min-w-[200px]'>
//                 <TextHeading className='text-xs lg:text-sm'>APR</TextHeading>
//                 <Paragraph className='text-sm lg:text-base'>{pool?.apr || '0%'}</Paragraph>
//               </div>
//               <div className='flex flex-col lg:min-w-[200px]'>
//                 <TextHeading className='text-xs lg:text-sm'>TVL</TextHeading>
//                 <Paragraph className='text-sm lg:text-base'>${formatAmount(pool?.tvlUSD || 0)}</Paragraph>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//       {isAdd && pool.type === PAIR_TYPES.WEIGHTED ? (
//         <Link
//           className='w-full lg:w-fit'
//           // eslint-disable-next-line max-len
//           href={`/pools/weighted-pool/create?firstAddress=${pool?.token0?.address}&secondAddress=${pool?.token1?.address}`}
//         >
//           <OutlinedButton className='h-11 w-full border border-primary-600 text-primary-600 hover:border-primary-600 hover:text-primary-600'>
//             {t(isAdd ? 'Create' : 'Deposit')}
//           </OutlinedButton>
//         </Link>
//       ) : (
//         <OutlinedButton
//           className='h-11 border border-primary-600 text-primary-600 hover:border-primary-600 hover:text-primary-600'
//           onClick={() => onDeposit(pool, isAdd)}
//         >
//           {t(isAdd ? 'Create' : 'Deposit')}
//         </OutlinedButton>
//       )}
//     </div>
//   )
// }

export default function Step1({ nextStep }) {
  // const { pairs } = usePairs()
  const t = useTranslations()

  const { replace } = useRouter()
  const searchParams = useSearchParams()
  const firstAddress = searchParams.get('firstAddress') || null
  const secondAddress = searchParams.get('secondAddress') || null
  const pairType = searchParams.get('pairType') || null
  const firstAsset = useGetAsset(firstAddress)
  const secondAsset = useGetAsset(secondAddress)

  const [step, setStep] = useState(1)

  // const [isOpenNavigation, setIsOpenNavigation] = useState(false)
  // const toggleDrawer = () => {
  //   setIsOpenNavigation(!isOpenNavigation)
  // }

  const updateSearchParams = useCallback(
    updates => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })

      const newPathname = `${window.location.pathname}?${params.toString()}`
      replace(newPathname)
    },
    [replace, searchParams],
  )

  const poolTypesData = useMemo(
    () => [
      {
        content: (
          <div className='flex flex-1 flex-col gap-1'>
            <TextHeading>{t('Concentrated Liquidity')}</TextHeading>
            <Paragraph className='text-sm'>{t('Conc Desc')}</Paragraph>
          </div>
        ),
        active: pairType === PAIR_TYPES.LSD,
        onClickHandler: () => {
          updateSearchParams({ pairType: PAIR_TYPES.LSD })
        },
      },
      {
        content: (
          <div className='flex flex-1 flex-col gap-1'>
            <TextHeading>{t('Weighted')}</TextHeading>
            <Paragraph className='text-sm'>{t('Weighted Desc')}</Paragraph>
          </div>
        ),
        active: pairType === PAIR_TYPES.WEIGHTED,
        onClickHandler: () => {
          updateSearchParams({ pairType: PAIR_TYPES.WEIGHTED })
        },
      },
      {
        content: (
          <div className='flex flex-1 flex-col gap-1'>
            <TextHeading>{t('Stable')}</TextHeading>
            <Paragraph className='text-sm'>{t('Stable Desc')}</Paragraph>
          </div>
        ),
        active: pairType === PAIR_TYPES.STABLE,
        onClickHandler: () => {
          updateSearchParams({ pairType: PAIR_TYPES.STABLE })
        },
      },
      {
        content: (
          <div className='flex flex-1 flex-col gap-1'>
            <TextHeading>{t('Classic')}</TextHeading>
            <Paragraph className='text-sm'>{t('Classic Desc')}</Paragraph>
          </div>
        ),
        active: pairType === PAIR_TYPES.CLASSIC,
        onClickHandler: () => {
          updateSearchParams({ pairType: PAIR_TYPES.CLASSIC })
        },
      },
    ],
    [pairType, t, updateSearchParams],
  )

  // const availablePools = useMemo(() => {
  //   if (!firstAddress || !secondAddress) return []
  //   const pools = pairs.filter(pool => {
  //     if (pool.type !== PAIR_TYPES.WEIGHTED) {
  //       return (
  //         [pool?.token0?.address, pool?.token1?.address].includes(wrappedAddress(firstAsset)) &&
  //         [pool?.token0?.address, pool?.token1?.address].includes(wrappedAddress(secondAsset)) &&
  //         (pairType ? pairType === pool.type : true)
  //       )
  //     }
  //     return (
  //       pool.tokens.map(token => token.address).includes(wrappedAddress(firstAsset)) &&
  //       pool.tokens.map(token => token.address).includes(wrappedAddress(secondAsset)) &&
  //       (pairType ? pairType === pool.type : true)
  //     )
  //   })
  //   mockWeightedPool.token0 = firstAsset
  //   mockWeightedPool.token1 = secondAsset
  //   return pools
  // }, [firstAddress, firstAsset, pairType, pairs, secondAddress, secondAsset])

  // const createNewPools = useMemo(() => {
  //   const result = []
  //   if (!firstAddress || !secondAddress) return []

  //   let checkLSD = Boolean(availablePools.find(item => item.type === PAIR_TYPES.LSD))
  //   if (pairType && pairType !== PAIR_TYPES.LSD) checkLSD = true
  //   if (!checkLSD) {
  //     result.push({
  //       symbol: `${firstAsset?.symbol}/${secondAsset?.symbol}`,
  //       token0: firstAsset,
  //       token1: secondAsset,
  //       type: PAIR_TYPES.LSD,
  //     })
  //   }

  //   let checkClassic = Boolean(availablePools.find(item => item.type === PAIR_TYPES.CLASSIC))
  //   if (pairType && pairType !== PAIR_TYPES.CLASSIC) checkClassic = true
  //   if (!checkClassic) {
  //     result.push({
  //       ...mockWeightedPool,
  //       symbol: `${firstAsset?.symbol}/${secondAsset?.symbol}`,
  //       token0: firstAsset,
  //       token1: secondAsset,
  //       type: PAIR_TYPES.CLASSIC,
  //     })
  //   }

  //   let checkStable = Boolean(availablePools.find(item => item.type === PAIR_TYPES.STABLE))
  //   if (pairType && pairType !== PAIR_TYPES.STABLE) checkStable = true
  //   if (!checkStable) {
  //     result.push({
  //       ...mockWeightedPool,
  //       symbol: `${firstAsset?.symbol}/${secondAsset?.symbol}`,
  //       token0: firstAsset,
  //       token1: secondAsset,
  //       type: PAIR_TYPES.STABLE,
  //     })
  //   }

  //   if (pairType && pairType !== PAIR_TYPES.WEIGHTED) return result
  //   result.push({
  //     ...mockWeightedPool,
  //     symbol: `${firstAsset?.symbol}-${secondAsset?.symbol}`,
  //     tokens: [
  //       { ...firstAsset, weight: 50 },
  //       { ...secondAsset, weight: 50 },
  //     ],
  //     type: PAIR_TYPES.WEIGHTED,
  //   })

  //   return result
  // }, [availablePools, firstAddress, firstAsset, pairType, secondAddress, secondAsset])
  const StepTitle = useMemo(() => {
    switch (step) {
      case 1: {
        return (
          <div className='flex flex-row items-center gap-3'>
            <PoolGroupIcon className='h-11 w-12 lg:h-[116px] lg:w-[108px]' />
            <TextHeading className='font-archia text-3xl font-semibold lg:text-[96px]'>
              {t('Chose Liquidity Type')}
            </TextHeading>
          </div>
        )
      }
      case 2:
        return (
          <div className='flex flex-row items-center gap-3'>
            <IconGroup
              className='-space-x-1'
              classNames={{
                image: 'outline-4 w-16 h-16',
              }}
              logo1={firstAsset?.logoURI ?? UNKNOWN_LOGO}
              logo2={secondAsset?.logoURI ?? UNKNOWN_LOGO}
            />
            <TextHeading className='font-archia text-3xl font-semibold leading-[96px] lg:text-[96px]'>
              {t('Add Concentrated Liquidity')}
            </TextHeading>
          </div>
        )
      default:
        return t('Select Pair')
    }
  }, [firstAsset?.logoURI, secondAsset?.logoURI, step, t])

  return (
    <div className='space-y-10 lg:space-y-20'>
      {StepTitle}
      <div className='flex flex-col gap-4 lg:flex-row'>
        {step === 1 && (
          <div className='flex w-full flex-col gap-3 lg:w-[60%]'>
            <TextHeading>{t('Liquidity Pool Type')}</TextHeading>
            <SelectorGrid classNames={{ item: 'bg-transparent pl-0' }} data={poolTypesData} isGrid={false} />
          </div>
        )}
        {step === 2 && (
          <>
            <div className='flex-[6] space-y-4'>
              <SelectPair firstAsset={firstAsset} secondAsset={secondAsset} updateSearchParams={updateSearchParams} />
            </div>
            <div className='flex-[4]'>
              <Box className='flex flex-row items-center justify-between rounded-xl bg-neutral-800'>
                <TextHeading className='font-archia text-3xl font-semibold text-neutral-50'>
                  {t('Pool Attributes')}
                </TextHeading>
                <div className='flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-600'>
                  <InfoCircleWhite className='h-5 w-5 stroke-neutral-400' />
                </div>
              </Box>
            </div>
          </>
        )}
      </div>
      <div className='flex gap-4'>
        <EmphasisButton onClick={() => setStep(prev => prev - 1)}>{t('Cancel')}</EmphasisButton>
        <PrimaryButton
          onClick={() => {
            if (step < 1) {
              setStep(prev => prev + 1)
            } else {
              nextStep(2)
              updateSearchParams({ step: 2 })
            }
          }}
        >
          {t('Next')}
        </PrimaryButton>
      </div>
    </div>
  )
}
