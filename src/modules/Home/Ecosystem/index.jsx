'use client'

import React, { useMemo, useState } from 'react'

import { cn } from '@/lib/utils'

import { FutureOfTrading } from './FutureOfTrading'
import { Grid } from './Grid'
import { GridLinesAnimation } from './GridLinesAnimation'
import { Heading } from '../Common/Heading'
import HomeImage from '../Common/HomeImage'

const data = ['Partners', 'Grants', 'Audits']
const partnerLogos = [
  { url: '/images/home/ecosystem/partners/ankr.svg' },
  { url: '/images/home/ecosystem/partners/frax.svg' },
  { url: '/images/home/ecosystem/partners/lista.png' },
  { url: '/images/home/ecosystem/partners/orbs.svg' },
  { url: '/images/home/ecosystem/partners/radiant.svg' },
  { url: '/images/home/ecosystem/partners/symmio.svg' },
  { url: '/images/home/ecosystem/partners/venus.svg' },
  { url: '/images/home/ecosystem/partners/xcad.svg' },
]
const auditLogos = [
  { url: '/images/home/ecosystem/audits/openzeppelin.svg' },
  { url: '/images/home/ecosystem/audits/peckshield.svg' },
]
const grantLogos = [
  { url: '/images/home/ecosystem/grants/bnbchain.svg' },
  { url: '/images/home/ecosystem/grants/opbnb.svg' },
]

function Ecosystem() {
  const [ecosystem, setEcoSystem] = useState(data[0])
  const logos = useMemo(() => {
    let arr = []
    switch (ecosystem) {
      case data[0]:
        arr = partnerLogos
        break
      case data[1]:
        arr = grantLogos
        break
      case data[2]:
        arr = auditLogos
        break

      default:
        break
    }
    return arr
  }, [ecosystem])

  return (
    <div className='relative w-full pb-20 lg:pb-36'>
      <div className='relative'>
        <Grid />
        <GridLinesAnimation />
      </div>
      <div className='relative z-10 flex flex-col items-center justify-center px-11 py-16 lg:pb-[204px] lg:pt-[217px] xl:px-0'>
        <div className='mx-auto w-full  max-w-[700px]'>
          <Heading heading='THE Ecosystem' title='Backed by the best' wrapperStyles='items-center' />
          <div className='mt-6 flex items-center justify-center space-x-3.5 lg:mt-8'>
            {data.map((item, idx) => (
              <div
                onClick={() => {
                  setEcoSystem(item)
                }}
                className={cn(
                  'font-figtree cursor-pointer rounded-full border px-5 py-2',
                  ecosystem === item ? 'border-primary-600 bg-transparent' : 'border-transparent bg-[#1B1624]',
                )}
                key={idx}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className='mt-14 flex w-full flex-wrap items-center justify-center -space-x-14 space-y-6 px-[38px]'>
          <div className='flex w-full flex-col gap-5 md:gap-6'>
            <div className='flex items-center justify-center gap-6 md:gap-14'>
              {logos.slice(0, 5).map((logo, index) => (
                <HomeImage
                  className='min-h-[28px] w-fit object-contain'
                  src={logo.url}
                  alt={`Logo ${index + 1}`}
                  key={`first-${index}`}
                />
              ))}
            </div>
            <div className='flex items-center justify-center gap-6 md:gap-14'>
              {logos.slice(5).map((logo, index) => (
                <HomeImage
                  className={cn('min-h-[28px] w-fit object-contain')}
                  src={logo.url}
                  alt={`Logo ${index + 6}`}
                  key={`second-${index}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <FutureOfTrading />
    </div>
  )
}

export default Ecosystem
