'use client'

import { useTranslations } from 'next-intl'
import React from 'react'

import { LoadingIndicator } from '@/components/loadingIndicator'

import { Illustration } from './Illustration'
import { Heading } from '../Common/Heading'
import HomeImage from '../Common/HomeImage'

const q2Data = [
  {
    value: 'Concentrated Liquidity',
    icon: 'checkMark',
  },
  {
    value: 'Limit and TWAP',
    icon: 'checkMark',
  },
  {
    value: 'Perpetual DEX',
    icon: 'checkMark',
  },
  {
    value: 'THE Liquidity Hub',
    icon: 'checkMark',
  },

  {
    value: 'On-Chain Market Making',
    icon: 'checkMark',
  },
  {
    value: 'Single Token Vaults',
    icon: 'checkMark',
  },
]
const q3_q4Data = [
  {
    value: 'New Branding and UI',
    icon: 'checkMark',
  },
  {
    value: 'THE Smart Wallet',
    icon: 'progress',
  },
  {
    value: 'ARENA V1',
  },
  {
    value: 'ALPHA V0 opBNB',
  },

  {
    value: 'THENA V3',
  },
  {
    value: 'Cross-Chain Voting',
  },
  {
    value: 'THE Card & Fiat Off-ramp',
  },
]
const futureBeyond = [
  {
    value: 'WARP Launchpad Accelerator',
  },
  {
    value: 'THE Ambassador Program',
  },
  {
    value: 'THENA R&D',
  },
  {
    value: 'THENA VIP',
  },
  {
    value: 'ALPHA V1',
  },
  {
    value: 'THE Club',
  },
]

function Build() {
  const t = useTranslations('Home')

  return (
    <div className='mx-auto w-full max-w-[1152px] px-6 xl:px-0'>
      <div className='relative flex w-full flex-col items-center justify-center'>
        <Illustration />
        <Heading heading={t('Build with THENA')} wrapperStyles='items-center absolute bottom-20' title={t('ROADMAP')} />
      </div>
      <div className='-mt-10 flex w-full flex-row md:mt-0 lg:flex-col'>
        <div className='relative w-0.5 bg-[#1B1624] lg:h-0.5 lg:w-full'>
          <div className='h-[calc(50%+97px)] w-0.5 bg-gradient-to-b from-[#DC01D4]/[0%] to-[#DC01D4] lg:h-full lg:w-1/2 lg:bg-gradient-to-r' />
          <div className='absolute -left-[7px] top-[calc(50%+87px)] h-4 w-4 rounded-full bg-[#D702D0] lg:-top-2 lg:left-[calc(50%-8px)]' />
        </div>
        <div className='relative w-full items-start lg:flex lg:w-auto'>
          <div className='absolute hidden h-full w-full items-center justify-center md:flex'>
            <div className='stats-blob absolute top-0 h-full w-full max-w-[400px] opacity-[0.45] blur-[264px] filter' />
          </div>
          <div className='relative z-10 flex w-full flex-row items-center justify-center lg:w-1/3 lg:flex-col'>
            <div className='h-0.5 w-6 bg-[#1B1624] lg:h-12 lg:w-0.5'>
              <div className='h-0 w-full bg-[#CD07D2]' />
            </div>
            <div className='w-full rounded-[20px] bg-gradient-to-b from-white/[0.08] to-transparent p-px'>
              <div className='rounded-[20px] bg-[rgba(15,7,18,0.45)] px-7 pb-[22px] pt-2.5'>
                <p className='font-figtree text-lg font-bold !leading-[48px] tracking-[-0.54px] text-[#FC86E2] lg:text-xl lg:tracking-[-0.6px]'>
                  2023
                </p>
                <div className='mt-2.5 w-full'>
                  {q2Data.map((item, idx) => (
                    <div className='flex items-center justify-between py-3' key={idx}>
                      <p className='text-[13px] font-medium leading-6 tracking-[-0.48px] text-white/[0.65] lg:text-base lg:text-white/[0.85]'>
                        {t(item.value)}
                      </p>
                      {item.icon && (
                        <>
                          {item.icon === 'checkMark' ? (
                            <HomeImage className='w-fit' alt='icon' src='/images/home/build/check.svg' />
                          ) : (
                            <LoadingIndicator color='secondary' />
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className='relative z-10 mt-6 flex w-full flex-row items-center justify-center lg:ml-8 lg:mt-0 lg:w-1/3 lg:flex-col'>
            <div className='h-0.5 w-6 bg-[#CD07D2] lg:flex lg:h-12 lg:w-0.5'>
              <div className='h-0 w-full bg-[#CD07D2]' />
            </div>
            <div className='w-full rounded-[20px] bg-gradient-to-b from-[#CD07D2] to-transparent p-px'>
              <div className='rounded-[20px] bg-[rgba(15,7,18,0.80)]'>
                <div className='rounded-[20px] bg-[rgba(15,7,18,0.55)] px-7 pb-[22px] pt-2.5'>
                  <p className='font-figtree text-lg font-bold !leading-[48px] tracking-[-0.54px] text-[#FC86E2] lg:text-xl lg:tracking-[-0.6px]'>
                    2024 Q1-Q2
                  </p>
                  <div className='mt-2.5 w-full'>
                    {q3_q4Data.map((item, idx) => (
                      <div className='flex items-center justify-between py-3' key={idx}>
                        <p className='text-[13px] font-medium leading-6 tracking-[-0.48px] text-white/[0.65] lg:text-base lg:text-white/[0.85]'>
                          {t(item.value)}
                        </p>
                        {item.icon && (
                          <>
                            {item.icon === 'checkMark' ? (
                              <HomeImage className='w-fit' alt='icon' src='/images/home/build/check.svg' />
                            ) : (
                              <LoadingIndicator color='secondary' />
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className='relative z-10 mt-6 flex w-full flex-row items-center justify-center lg:ml-8 lg:mt-0 lg:w-1/3 lg:flex-col'>
            <div className='h-0.5 w-6 bg-[#1B1624] lg:flex lg:h-12 lg:w-0.5'>
              <div className='h-0 w-full bg-[#CD07D2]' />
            </div>
            <div className='w-full rounded-[20px] bg-gradient-to-b from-white/[0.08] to-transparent p-px'>
              <div className='rounded-[20px] bg-[rgba(15,7,18,0.45)] px-7 pb-[22px] pt-2.5'>
                <p className='font-figtree text-lg font-bold !leading-[48px] tracking-[-0.54px] text-[#FC86E2] lg:text-xl lg:tracking-[-0.6px]'>
                  2024 Q3-Q4
                </p>
                <div className='mt-2.5 w-full'>
                  {futureBeyond.map((item, idx) => (
                    <div className='flex items-center justify-between py-3' key={idx}>
                      <p className='text-[13px] font-medium leading-6 tracking-[-0.48px] text-white/[0.65] lg:text-base lg:text-white/[0.85]'>
                        {t(item.value)}
                      </p>
                      {item.icon && (
                        <>
                          {item.icon === 'checkMark' ? (
                            <HomeImage className='w-fit' alt='icon' src='/images/home/build/check.svg' />
                          ) : (
                            <LoadingIndicator color='secondary' />
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Build
