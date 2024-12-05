import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import CircleImage from '@/components/image/CircleImage'
import { TextHeading } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { useTokenUSDValue } from '@/hooks/usePrices'
import { cn, formatAmount } from '@/lib/utils'

function LiquidityFeeRow({ token, pairType }) {
  const t = useTranslations()
  // const { getValueTokenAmountToUSD } = useTokenUSDValue()

  return (
    <div className='grid grid-cols-2 gap-y-4 rounded-lg bg-neutral-800  px-5 py-4 lg:grid-cols-3'>
      <div className='flex flex-col items-start lg:col-span-1 lg:flex-row lg:items-center'>
        <div className='mb-1 text-[13px] font-normal leading-5 lg:hidden'>
          {t(pairType === PAIR_TYPES.WEIGHTED ? 'Token and Weight' : 'Token')}
        </div>
        <div className='flex items-center gap-2 lg:gap-3'>
          <CircleImage className='h-7 w-7 lg:h-8 lg:w-8' src={token?.logoURI || UNKNOWN_LOGO} alt='thena logo' />
          <TextHeading className='text-base font-medium lg:text-[18px] lg:leading-[26px]'>{token?.symbol}</TextHeading>
          <span
            className={cn(
              'text-xs font-medium text-neutral-300 lg:text-[18px] lg:leading-[26px]',
              !token?.weight && 'hidden',
            )}
          >
            {token?.weight}%
          </span>
        </div>
      </div>
      <div className='flex flex-col items-start'>
        <div className='mb-1 text-[13px] font-normal leading-5 lg:hidden'>{t('Current Liquidity')}</div>
        <p className='text-[18px] font-medium leading-[26px]'>{formatAmount(token?.reserve)}</p>
        <p className='text-[14px] font-normal leading-[26px] text-neutral-200'>
          ${formatAmount(getValueTokenAmountToUSD(token.address, token.reserve))}
        </p>
      </div>
      <div className='flex flex-col items-start'>
        <div className='mb-1 text-[13px] font-normal leading-5 lg:hidden'>{t('Generated Cumulative Fees')}</div>
        <p className='text-[18px] font-medium leading-[26px]'>TODO (API)</p>
        <p className='text-[14px] font-normal leading-[26px] text-neutral-200'>$TODO</p>
        {/* <p className='text-[18px] font-medium leading-[26px]'>{formatAmount(token?.claimable)}</p>
<p className='text-[14px] font-normal leading-[26px] text-neutral-200'>${formatAmount(token?.claimableUsd)}</p> */}
      </div>
    </div>
  )
}

export function LiquidityFeesTable({ pool }) {
  const t = useTranslations()
  // const { address: userAddress, chainId } = useAccount()

  // MARK: Get claimable token for WEIGHTED
  // const weightedContract = getWeightedPoolContract(pool?.address, chainId)
  // const { data: feeContractAddress } = useReadContract({
  //   ...weightedContract,
  //   functionName: 'feesContract',
  //   query: {
  //     enabled: Boolean(pool?.address) && pool.type === PAIR_TYPES.WEIGHTED,
  //   },
  // })

  // const { data: expectedFees = [] } = useReadContract({
  //   address: feeContractAddress,
  //   abi: weightedPoolAbiFees,
  //   functionName: 'expectedFees',
  //   args: [userAddress],
  //   query: {
  //     enabled: Boolean(feeContractAddress) && pool.type === PAIR_TYPES.WEIGHTED,
  //   },
  // })

  const tokensList = useMemo(() => {
    if (pool.type !== PAIR_TYPES.WEIGHTED) {
      return [
        {
          ...pool.token0,
          reserve: pool.reserve0,
          claimable: 'TODO',
          claimableUsd: 'TODO',
        },
        {
          ...pool.token1,
          reserve: pool.reserve1,
          claimable: 'TODO',
          claimableUsd: 'TODO',
        },
      ]
    }
    if (!pool?.tokens) return []

    return pool.tokens.map(token => {
      const reserve = Number(token?.reserve ?? 0)

      return {
        ...token,
        reserve,
        claimable: 'TODO',
        claimableUsd: 'TODO',
      }
    })
  }, [pool.reserve0, pool.reserve1, pool.token0, pool.token1, pool.tokens, pool.type])

  return (
    <div className='flex flex-col gap-4 rounded-lg bg-neutral-900 p-6'>
      <div className='hidden grid-cols-3 px-5 text-[14px] font-normal leading-5 lg:grid'>
        <div className='col-span-1'>{t(pool.type === PAIR_TYPES.WEIGHTED ? 'Token and Weight' : 'Token')}</div>
        <div>{t('Current Liquidity')}</div>
        <div>{t('Generated Cumulative Fees')}</div>
      </div>

      <div className='flex flex-col gap-3'>
        {tokensList.map(token => (
          <LiquidityFeeRow key={token?.address} token={token} pairType={pool.type} />
        ))}
      </div>
    </div>
  )
}
