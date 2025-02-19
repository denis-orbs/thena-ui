import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { WBNB } from 'thena-sdk-core'
import { useBalance, useReadContract } from 'wagmi'

import { ERC20Abi } from '@/constant/abi'
import { useAssets } from '@/context/assetsContext'
import useWallet from '@/hooks/useWallet'
import { cn, formatAmount, fromWei } from '@/lib/utils'

import AssetDropdown from '../dropdown/AssetDropdown'
import IconGroup from '../icongroup'
import CircleImage from '../image/CircleImage'
import Skeleton from '../skeleton'
import Tabs from '../tabs'
import { TextSubHeading } from '../typography'

function BalanceInput({
  asset,
  setAsset,
  maxBalance = null,
  amount,
  onAmountChange,
  title,
  autoFocus = false,
  weight,
  showPercent = true,
  classNames,
}) {
  const assets = useAssets()
  const t = useTranslations()
  const { account } = useWallet()

  const { data: balanceOf } = useReadContract({
    abi: ERC20Abi,
    address: asset?.address,
    functionName: 'balanceOf',
    args: [account],
    query: {
      enabled: !!asset && Boolean(account) && asset?.address !== 'BNB',
    },
  })

  const { data: nativeBalance } = useBalance({
    address: account,
  })

  const max = useMemo(() => {
    if (maxBalance) {
      return maxBalance
    }

    return asset?.address === 'BNB'
      ? fromWei(nativeBalance?.value || 0n, 18)
      : fromWei(balanceOf || 0n, asset?.decimals)
  }, [asset?.address, asset?.decimals, balanceOf, maxBalance, nativeBalance])

  const data = useMemo(
    () => assets.filter(item => item.address === 'BNB' || item.address === WBNB[item.chainId]?.address?.toLowerCase()),
    [assets],
  )

  const percents = useMemo(
    () => [
      {
        label: '10%',
        onClickHandler: () => onAmountChange(max.times(0.1).dp(asset.decimals).toString(10)),
      },
      {
        label: '25%',
        onClickHandler: () => onAmountChange(max.times(0.25).dp(asset.decimals).toString(10)),
      },
      {
        label: '50%',
        onClickHandler: () => onAmountChange(max.times(0.5).dp(asset.decimals).toString(10)),
      },
      {
        label: 'Max',
        onClickHandler: () => onAmountChange(max.dp(asset.decimals).toString(10)),
      },
    ],
    [asset, max, onAmountChange],
  )

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center justify-between'>
        <p className={cn('font-medium text-white', classNames?.title)}>{title}</p>
        {showPercent && <Tabs data={percents} />}
      </div>
      <div className='flex flex-col gap-3 self-stretch rounded-xl border border-neutral-700 p-4'>
        <div className='flex items-center justify-between gap-2'>
          <input
            type='number'
            className='w-full border-0 bg-transparent p-0 text-xl text-neutral-50 placeholder-neutral-400'
            placeholder='0.0'
            value={amount ?? ''}
            onChange={e => {
              onAmountChange(Number(e.target.value) < 0 ? '' : e.target.value)
            }}
            min={0}
            autoFocus={autoFocus}
          />
          {setAsset ? (
            <AssetDropdown selected={asset} setSelected={setAsset} data={data} />
          ) : asset ? (
            <div
              className={cn(
                'inline-flex items-center justify-center gap-2',
                'rounded-full bg-neutral-600 text-sm text-neutral-200',
                'py-1.5 pl-1.5 pr-2',
              )}
            >
              {maxBalance ? (
                <IconGroup
                  className='-space-x-2'
                  classNames={{
                    image: 'outline-2 w-6 h-6',
                  }}
                  logo1='https://cdn.thena.fi/assets/BSC.png'
                  logo2='https://cdn.thena.fi/assets/BNB.png'
                />
              ) : (
                <CircleImage alt='thena' className='h-6 w-6' src={asset.logoURI ?? ''} />
              )}
              <span className='text-nowrap'>
                {`${maxBalance ? 'BNB + WBNB' : asset.symbol} ${weight ? `(${weight}%)` : ''}`}
              </span>
            </div>
          ) : (
            <Skeleton className='h-6 w-10' />
          )}
        </div>
        <div className='flex items-center justify-between gap-2'>
          <TextSubHeading>${formatAmount(amount * (asset?.price || 0))}</TextSubHeading>
          <TextSubHeading className='space-x-2'>
            <span>
              {t('Balance')}:{formatAmount(max)}
            </span>
            <span
              onClick={() => onAmountChange(max.dp(asset.decimals).toString(10))}
              className={cn('cursor-pointer text-primary-600', max?.eq(0) && 'hidden')}
            >
              {t('Max')}
            </span>
          </TextSubHeading>
        </div>
      </div>
    </div>
  )
}

export default BalanceInput
