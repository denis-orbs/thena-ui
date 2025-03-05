import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'
import { zeroAddress } from 'viem'
import { useReadContract } from 'wagmi'

import { GAMMA_TYPES, ICHI_TYPES, MANUAL_TYPES, NARROW_TYPES, PAIR_TYPES, SCAN_URLS } from '@/constant'
import { algebraPoolV3Abi, basePluginAbi } from '@/constant/abi'
import Contracts from '@/constant/contracts'
import { useGetAdministrator } from '@/hooks/fusion/usePoolAlgebraInfo'
import { cn, formatAddress, formatAmount, goScan } from '@/lib/utils'
import { useChainSettings, useLocaleSettings } from '@/state/settings/hooks'
import { LinkExternalPrimaryIcon } from '@/svgs'

export function PoolAttributesCL({ strategy, pool }) {
  const isAutomatic = !MANUAL_TYPES.includes(strategy.title)
  const t = useTranslations()

  const { networkId } = useChainSettings()
  const { locale } = useLocaleSettings()

  const { poolAdministrators, pluginAdministrators } = useGetAdministrator()

  const { data: plugInAddress } = useReadContract({
    address: strategy?.address,
    abi: algebraPoolV3Abi,
    functionName: 'plugin',
    query: {
      enabled: MANUAL_TYPES.includes(strategy?.title),
      staleTime: Infinity,
    },
  })
  const { data: feeType } = useReadContract({
    address: plugInAddress,
    abi: basePluginAbi,
    functionName: 'feeType',
    query: {
      enabled: !!plugInAddress && plugInAddress !== zeroAddress,
      staleTime: Infinity,
    },
  })

  const createdAt = useMemo(() => {
    const date = new Date(strategy.createdAt ?? pool?.createdAt)
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZone: 'UTC',
      timeZoneName: 'short',
    }

    return date.toLocaleString(locale, options)
  }, [locale, pool.createdAt, strategy.createdAt])

  const linkDocsStrategy = useMemo(() => {
    let resultProvider = ''
    let resultType = ''
    if (ICHI_TYPES.includes(strategy.title)) {
      resultProvider = 'https://docs.ichi.org/home/how-ichi-works'
      resultType = 'https://docs.ichi.org/home/how-ichi-works#singletoken-deposit'
    }
    if (GAMMA_TYPES.includes(strategy.title)) {
      resultProvider = 'https://docs.gamma.xyz/gamma/features/introduction'
      if (strategy.title.includes('Narrow')) {
        resultType = 'https://docs.gamma.xyz/gamma/features/strategies#dynamic-range-wide-narrow'
      }
      if (strategy.title.includes('Stable')) {
        resultType = 'https://docs.gamma.xyz/gamma/features/strategies#stable'
      }
    }
    return [resultProvider, resultType]
  }, [strategy.title])

  const poolDeployer = useMemo(
    () => (strategy.title.includes('Farming') ? zeroAddress : Contracts.pluginFactory[networkId]),
    [networkId, strategy.title],
  )

  return (
    <div className='rounded-lg border border-dashed border-primary-500'>
      <div className='space-y-4 rounded-lg bg-primary-950 p-6 text-[14px] font-normal leading-5'>
        {/* Pool Name */}
        <div className='grid grid-cols-7'>
          <div className='col-span-3 text-neutral-300'>{t('Name')}:</div>
          <div className='col-span-4 text-neutral-50'>{`Conc. Liquidity ${pool.symbol ?? strategy?.symbol}`}</div>
        </div>

        {/* Pool Symbol */}
        <div className='grid grid-cols-7'>
          <div className='col-span-3 text-neutral-300'>{t('Symbol')}:</div>
          <div className='col-span-4 text-neutral-50'>{pool.symbol ?? strategy?.symbol}</div>
        </div>

        {/* Pool Type */}
        <div className='grid grid-cols-7'>
          <div className='col-span-3 text-neutral-300'>{t('Type')}:</div>
          <div className='col-span-4 flex items-center gap-1 text-neutral-50'>
            <Link
              className='flex items-center gap-1 text-primary-500'
              target='_blank'
              href='https://github.com/cryptoalgebra/Algebra/tree/integral-v1.2'
            >
              {t('Type attribute CL pool')}
              <div className='item-center flex cursor-pointer gap-1'>
                <LinkExternalPrimaryIcon className='inline-block h-4 w-4 !stroke-primary-600' />
              </div>
            </Link>
          </div>
        </div>
        {isAutomatic && (
          <>
            {/* Strategy Provider */}
            <div className='grid grid-cols-7'>
              <div className='col-span-3 text-neutral-300'>{t('Strategy Provider')}:</div>
              <Link
                target='_blank'
                href={linkDocsStrategy[0]}
                className='col-span-4 flex items-center gap-1 text-primary-500'
              >
                <span>
                  {ICHI_TYPES.includes(strategy.title)
                    ? 'Ichi'
                    : NARROW_TYPES.includes(strategy.title)
                      ? 'Gamma'
                      : 'Unknown'}
                </span>
                <div className='item-center flex cursor-pointer gap-1'>
                  <LinkExternalPrimaryIcon className='inline-block h-4 w-4 !stroke-primary-600' />
                </div>
              </Link>
            </div>

            {/* Strategy Type */}
            <div className='grid grid-cols-7'>
              <div className='col-span-3 text-neutral-300'>{t('Strategy Type')}:</div>
              <Link
                target='_blank'
                href={linkDocsStrategy[1]}
                className='col-span-4 flex items-center gap-1 text-primary-500'
              >
                <span>
                  {ICHI_TYPES.includes(strategy.title)
                    ? 'Single deposit'
                    : NARROW_TYPES.includes(strategy.title)
                      ? 'Narrow'
                      : 'Unknown'}
                </span>
                <div className='item-center flex cursor-pointer gap-1'>
                  <LinkExternalPrimaryIcon className='inline-block h-4 w-4 !stroke-primary-600' />
                </div>
              </Link>
            </div>
          </>
        )}

        {/* Pool Deployer */}
        <div className='grid grid-cols-7'>
          <div className='col-span-3 text-neutral-300'>{t('Pool Deployer')}:</div>
          <div className='col-span-4 text-neutral-50'>
            <div
              onClick={() => goScan(networkId, poolDeployer)}
              className='item-center flex cursor-pointer gap-1 text-primary-500'
            >
              <span>{formatAddress(poolDeployer)}</span>
              <LinkExternalPrimaryIcon className='inline-block h-4 w-4 !stroke-primary-600' />
            </div>
          </div>
        </div>

        {/* Pool Address */}
        <div className='grid grid-cols-7'>
          <div className='col-span-3 text-neutral-300'>{t('Pool Address')}:</div>
          <div className='col-span-4 text-neutral-50'>
            <div
              onClick={() => goScan(networkId, strategy.address)}
              className='item-center flex cursor-pointer gap-1 text-primary-500'
            >
              <span>{formatAddress(strategy.address)}</span>
              <LinkExternalPrimaryIcon className='inline-block h-4 w-4 !stroke-primary-600' />
            </div>
          </div>
        </div>

        {/* Pool Plugin */}
        {Boolean(pool.plugInAddress) && (
          <div className='grid grid-cols-7'>
            <div className='col-span-3 text-neutral-300'>{t('Pool Plugin')}:</div>
            <div className='col-span-4 text-neutral-50'>
              <div
                onClick={() => goScan(networkId, pool.plugInAddress)}
                className='item-center flex cursor-pointer gap-1'
              >
                <span>{pool.plugInAddress}</span>
                <LinkExternalPrimaryIcon className='inline-block h-4 w-4 !stroke-primary-600' />
              </div>
            </div>
          </div>
        )}

        {/* Swap fees */}
        <div className='grid grid-cols-7'>
          <div className='col-span-3 text-neutral-300'>{t('Swap fees')}:</div>
          <div className='col-span-4 text-neutral-50'>
            <span className='mr-1'>{strategy.title === 'CL_SwapFee' ? strategy?.fee : pool?.fee}%</span>
            <span className={cn(plugInAddress && 'hidden')}>({t('editable by governance')})</span>

            <Link
              target='_blank'
              className={cn(
                'hidden text-primary-500',
                plugInAddress && plugInAddress !== zeroAddress && 'inline-block',
              )}
              href={
                feeType
                  ? 'https://docs.algebra.finance/algebra-integral-documentation/algebra-integral-technical-reference/plugins/sliding-fee'
                  : 'https://docs.algebra.finance/algebra-integral-documentation/algebra-integral-technical-reference/plugins/adaptive-fee'
              }
            >
              {feeType ? '(Sliding)' : '(Adaptive)'}
            </Link>
          </div>
        </div>

        {/* Pool Access Control Roles */}
        <div className='grid grid-cols-7'>
          <div className='col-span-3 text-neutral-300'>{t('Pool Access Control Roles')}:</div>
          <div className='col-span-4 text-neutral-50'>
            <ul className='flex flex-col gap-1'>
              <li>Pool Administrator:</li>
              {poolAdministrators.map(addr => (
                <div key={addr} className='flex flex-col'>
                  <li>
                    <Link
                      className='flex items-center gap-1 text-primary-500'
                      href={`${SCAN_URLS[networkId]}/address/${addr}`}
                      target='_blank'
                    >
                      {formatAddress(addr)}
                      <LinkExternalPrimaryIcon className='inline-block h-4 w-4 !stroke-primary-600' />
                    </Link>
                  </li>
                </div>
              ))}
            </ul>

            <ul className='flex flex-col gap-1'>
              <li>Plugin Administrator:</li>
              {pluginAdministrators.map(addr => (
                <div key={addr} className='flex'>
                  <li>
                    <Link
                      className='flex items-center gap-1 text-primary-500'
                      href={`${SCAN_URLS[networkId]}/address/${addr}`}
                      target='_blank'
                    >
                      {formatAddress(addr)}
                      <LinkExternalPrimaryIcon className='inline-block h-4 w-4 !stroke-primary-600' />
                    </Link>
                  </li>
                </div>
              ))}
            </ul>
          </div>
        </div>

        {/* Creation date */}
        {createdAt ? (
          <div className='grid grid-cols-7'>
            <div className='col-span-3 text-neutral-300'>{t('Creation date')}:</div>
            <div className='col-span-4 text-neutral-50'>{createdAt}</div>
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  )
}

export function NormalPoolAttributes({ pool }) {
  const t = useTranslations()

  const { networkId } = useChainSettings()
  const { locale } = useLocaleSettings()

  const createdAt = useMemo(() => {
    const date = new Date(pool.createdAt)
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZone: 'UTC',
      timeZoneName: 'short',
    }

    return date.toLocaleString(locale, options)
  }, [locale, pool.createdAt])

  return (
    <div>
      <div className='flex flex-col gap-4 rounded-lg border border-dashed border-primary-600 bg-primary-950 p-6 text-[14px] font-normal leading-5'>
        {/* Pool name */}
        <div className='grid grid-cols-7'>
          <div className='col-span-3 text-neutral-300'>{t('Name')}:</div>
          <div className='col-span-4 text-neutral-50'>
            {pool.type === PAIR_TYPES.WEIGHTED
              ? pool?.name ?? pool?.symbol
              : pool.type === PAIR_TYPES.STABLE
                ? `sAMM ${pool?.symbol}`
                : `vAMM ${pool?.symbol}`}
          </div>
        </div>

        {/* Pool Symbol */}
        <div className='grid grid-cols-7'>
          <div className='col-span-3 text-neutral-300'>{t('Symbol')}:</div>
          <div className='col-span-4 text-neutral-50'>{pool?.symbol}</div>
        </div>

        {/* Pool type */}
        <div className='grid grid-cols-7'>
          <div className='col-span-3 text-neutral-300'>{t('Type')}:</div>
          <div className='col-span-4 text-neutral-50'>{pool?.type}</div>
        </div>

        {/* Swap fees */}
        <div className='grid grid-cols-7'>
          <div className='col-span-3 text-neutral-300'>{t('Swap fees')}:</div>
          <div className='col-span-4 text-neutral-50'>
            <span className='mr-1'>{pool?.fee}%</span>
            <span>({t('editable by governance')})</span>
          </div>
        </div>

        {/* Pool Owner */}
        {Boolean(pool?.owner) && (
          <div className='grid grid-cols-7'>
            <div className='col-span-3 text-neutral-300'>{t('Pool Owner')}:</div>
            <div className='col-span-4 text-neutral-50'>
              <div
                onClick={() => goScan(networkId, pool.owner)}
                className='item-center flex cursor-pointer gap-1 text-primary-500'
              >
                <span>{formatAddress(pool.owner)}</span>
                <LinkExternalPrimaryIcon className='inline-block h-4 w-4 !stroke-primary-600' />
              </div>
            </div>
          </div>
        )}

        {Boolean(pool?.createdAt) && (
          <div className='grid grid-cols-7'>
            <div className='col-span-3 text-neutral-300'>{t('Creation date')}:</div>
            <div className='col-span-4 text-neutral-50'>{createdAt}</div>
          </div>
        )}

        {/* LP token price */}
        <div className='grid grid-cols-7'>
          <div className='col-span-3 text-neutral-300'>{t('LP token price')}:</div>
          <div className='col-span-4 text-neutral-50'>
            ${formatAmount(pool?.lpPrice ?? pool?.subpools?.[0]?.lpPrice ?? 0)}
          </div>
        </div>

        {/* Pool address */}
        <div className='grid grid-cols-7'>
          <div className='col-span-3 text-neutral-300'>{t('Pool Address')}:</div>
          <div className='col-span-4 text-primary-500'>
            <div onClick={() => goScan(networkId, pool?.address)} className='item-center flex cursor-pointer gap-1'>
              <span>{formatAddress(pool?.address)}</span>
              <LinkExternalPrimaryIcon className='inline-block h-4 w-4 !stroke-primary-600' />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
