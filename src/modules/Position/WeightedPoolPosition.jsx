import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { formatUnits, getAddress } from 'viem'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'

import RemoveWeightedModal from '@/app/pools/RemoveWeightedModal'
import { EmphasisButton, OutlinedButton, TextButton } from '@/components/buttons/Button'
import { ThreeIconGroup } from '@/components/icongroup/ThreeIconGroup'
import CustomTooltip from '@/components/tooltip'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { weightedPoolAbiFees } from '@/constant/abi'
import { getVaultContract, getWeightedPoolContract } from '@/lib/contracts'
import { formatAmount } from '@/lib/utils'
import { InfoIcon } from '@/svgs'

export function WeightedPoolPosition({ pool }) {
  const t = useTranslations()
  const { address: userAddress, chainId } = useAccount()
  const [isOpenRemove, setIsOpenRemove] = useState(false)

  // MARK: Get claimable token for WEIGHTED
  const poolContract = getWeightedPoolContract(pool?.address, chainId)
  const vaultContract = getVaultContract(chainId)
  const { data } = useReadContracts({
    contracts: [
      {
        ...poolContract,
        functionName: 'feesContract',
      },
      {
        ...poolContract,
        functionName: 'totalSupply',
      },
      {
        ...poolContract,
        functionName: 'balanceOf',
        args: [userAddress],
      },
      {
        ...vaultContract,
        functionName: 'getPoolTokens',
        args: [pool?.poolId],
      },
    ],
    query: {
      enabled: Boolean(pool?.address) && pool.type === PAIR_TYPES.WEIGHTED,
    },
  })

  const feeContract = data?.[0]?.result
  const totalSupply = Number(data?.[1]?.result ?? 0)
  const balance = Number(data?.[2]?.result ?? 0)
  const tokenAddresses = data?.[3]?.result?.[0]
  const tokenAmounts = data?.[3]?.result?.[1]

  const { data: expectedFees = [] } = useReadContract({
    address: feeContract,
    abi: weightedPoolAbiFees,
    functionName: 'expectedFees',
    args: [userAddress],
    query: {
      enabled: Boolean(feeContract) && pool.type === PAIR_TYPES.WEIGHTED,
    },
  })

  const mappedToken = useMemo(() => {
    const map = {}
    tokenAddresses?.forEach(address => {
      const token = pool.tokens.find(item => getAddress(item.address) === getAddress(address))
      map[address] = token
    })
    return map
  }, [pool.tokens, tokenAddresses])

  const depositValue = useMemo(() => {
    if (!tokenAmounts || tokenAmounts.length === 0 || !balance) {
      return {
        tokens: [],
        depositUsd: 0,
      }
    }

    const poolValueUsd = tokenAmounts.reduce((sum, amount, index) => {
      const token = mappedToken?.[tokenAddresses?.[index]]
      return sum + Number(token?.price) * Number(formatUnits(amount, token.decimals))
    }, 0)

    const ratio = balance / totalSupply

    return {
      tokens: tokenAddresses?.map((address, index) => {
        const token = mappedToken[address]
        return {
          ...token,
          amount: ratio * formatUnits(Number(tokenAmounts[index]), token.decimals),
        }
      }, []),
      depositUsd: ratio * poolValueUsd,
    }
  }, [balance, mappedToken, tokenAddresses, tokenAmounts, totalSupply])

  const claimable = useMemo(() => {
    if (expectedFees.length === 0) return 0

    let total = 0
    const tokenList = tokenAddresses?.map((address, index) => {
      const fee = Number(formatUnits(expectedFees[index], mappedToken[address].decimals))
      total += fee * mappedToken[address].price

      return {
        address,
        fee,
        ...mappedToken[address],
      }
    })

    return {
      total,
      tokenList,
    }
  }, [expectedFees, mappedToken, tokenAddresses])

  return (
    <div className='rounded-xl bg-neutral-900 p-4'>
      <div className='flex space-x-4'>
        <ThreeIconGroup
          classNames={{
            image: 'w-8 h-8 text-xl font-medium leading-5 text-[#1C2027]',
          }}
          logo1={pool?.tokens?.[0].logoURI ?? UNKNOWN_LOGO}
          logo2={pool?.tokens?.[1].logoURI ?? UNKNOWN_LOGO}
          extendNumber={(pool?.tokens?.length || 2) - 2}
        />
        <div className='flex items-center gap-2 lg:max-w-[90%]'>
          <div className='flex w-full flex-wrap items-center gap-1 '>
            {(pool?.tokens || []).map(token => (
              <div className='flex items-center gap-1' key={token?.address}>
                <span className='text-[16px] font-medium leading-5'>{token?.symbol}</span>
                <span className='text-sm font-medium leading-5 text-neutral-300 '>{token?.weight}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className='mt-4 flex flex-col gap-y-4'>
        <div className='flex justify-between'>
          <span className='text-neutral-300'>{t('APR')}</span>
          {/* TODO: mock value */}
          <span>0%</span>
        </div>

        <div className='flex justify-between'>
          <span className='text-neutral-300'>{t('Deposit Value in USD')}</span>
          <span>${formatAmount(depositValue.depositUsd)}</span>
        </div>

        {depositValue?.tokens.map((token, index) => (
          <div className='flex justify-between' key={index}>
            <span className='text-neutral-300'>
              {token.symbol} {t('Deposit')}
            </span>
            <span>
              <span>{formatAmount(token?.amount)}</span>
              <span className='text-neutral-300'>({token?.weight}%)</span>
            </span>
          </div>
        ))}

        <div className='flex justify-between'>
          <span className='text-neutral-300'>{t('Claimable Fees')}</span>
          <p className='flex items-center gap-2'>
            <span>${claimable.total}</span>
            <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={`net-${pool?.address}`} />
            <CustomTooltip id={`net-${pool?.address}`}>
              {claimable?.tokenList?.map((token, index) => (
                <p key={index}>{`${token.fee} ${token.name}`}</p>
              ))}
            </CustomTooltip>
          </p>
        </div>
      </div>

      <div className='mt-4 flex w-full gap-3'>
        <TextButton className='w-full' disabled>
          {t('Claim')}
        </TextButton>

        <OutlinedButton onClick={() => setIsOpenRemove(true)} className='w-full'>
          {t('Remove')}
        </OutlinedButton>

        <EmphasisButton className='w-full'>{t('Add')}</EmphasisButton>
      </div>
      <RemoveWeightedModal isOpen={isOpenRemove} pool={pool} setIsOpen={setIsOpenRemove} />
    </div>
  )
}
