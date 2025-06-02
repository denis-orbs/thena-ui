'use client'

import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import { cn } from '@/lib/utils'

import { Grid } from './Grid'
import { GridLinesAnimation } from './GridLinesAnimation'
import { Heading } from '../Common/Heading'
import HomeImage from '../Common/HomeImage'

const data = ['Partners', 'Grants', 'Audits', 'Communities']
const partnerLogos = [
  { url: '/images/home/ecosystem/partners/ankr.svg' },
  { url: '/images/home/ecosystem/partners/frax.svg' },
  { url: '/images/home/ecosystem/partners/listadao.svg' },
  { url: '/images/home/ecosystem/partners/orbs.svg' },
  { url: '/images/home/ecosystem/partners/radiant.svg' },
  { url: '/images/home/ecosystem/partners/symmio.svg' },
  { url: '/images/home/ecosystem/partners/venus.svg' },
  { url: '/images/home/ecosystem/partners/xcad.svg' },
  { url: '/images/home/ecosystem/partners/Gamma.png' },
  { url: '/images/home/ecosystem/partners/Algebra.png' },
  { url: '/images/home/ecosystem/partners/EtherFi.png', icon: 'etherfi' },
  { url: '/images/home/ecosystem/partners/Lido.png' },
  { url: '/images/home/ecosystem/partners/Solv.svg' },
]
const auditLogos = [
  { url: '/images/home/ecosystem/audits/openzeppelin.svg' },
  { url: '/images/home/ecosystem/audits/peckshield.svg' },
  { url: '/images/home/ecosystem/audits/Hacken.png', icon: 'hacken', width: 'w-[152px]' },
]
const grantLogos = [{ url: '/images/home/ecosystem/grants/bnbchain.svg' }]
const communityLogos = [
  // { url: '/images/home/ecosystem/communities/THE-AI-Hub.svg', link: 'https://senq.theaihub.live' },
  { url: '/images/home/ecosystem/communities/CN.svg', link: 'https://x.com/ThenaCN' },
  { url: '/images/home/ecosystem/communities/ES.svg', link: 'https://x.com/ThenaESP' },
  { url: '/images/home/ecosystem/communities/CIS.svg', link: 'https://t.me/Thena_Fi_CIS' },
  { url: '/images/home/ecosystem/communities/KR.svg', link: 'https://x.com/ThenaKorea' },
  { url: '/images/home/ecosystem/communities/TR.svg', link: 'https://t.me/ThenaFiTurkiye' },
]

function Ecosystem() {
  const [ecosystem, setEcoSystem] = useState(data[0])
  const isSafari = useMemo(() => {
    if (typeof navigator !== 'undefined') {
      const { userAgent } = navigator
      const check = /^((?!chrome|android).)*safari/i.test(userAgent)
      return check
    }
  }, [])

  const t = useTranslations()
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
      case data[3]:
        arr = communityLogos
        break

      default:
        break
    }
    return arr
  }, [ecosystem])

  return (
    <div className='relative w-full'>
      <div className='relative'>
        <Grid />
        {!isSafari && <GridLinesAnimation />}
      </div>
      <div className='relative z-10 flex flex-col items-center justify-center px-11 py-16 lg:pt-[217px] lg:pb-[150px] xl:px-0'>
        <div className='mx-auto w-full max-w-[700px]'>
          <Heading heading={t('THE Ecosystem')} title={t('Backed by the best')} wrapperStyles='items-center' />
          <div className='mt-6 flex items-center justify-center gap-3.5 lg:mt-8'>
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
                {t(item)}
              </div>
            ))}
          </div>
        </div>
        <div className='mt-14 flex w-full flex-col flex-wrap items-center justify-center gap-6 px-[38px]'>
          <div
            className={cn(
              'flex w-full flex-wrap items-center justify-center lg:gap-14',
              ecosystem === data[3] ? 'gap-8 lg:max-w-[800px]' : 'gap-6 lg:max-w-[1000px]',
            )}
          >
            {logos.map((logo, index) => (
              <HomeImage
                className={cn(
                  'max-h-[47px] min-h-[26px] w-fit object-contain',
                  logo?.icon === 'hacken' ? 'max-h-4! min-h-4!' : logo?.icon === 'etherfi' ? 'max-h-14! min-h-14!' : '',
                  logo.url.endsWith('Algebra.png') ? 'h-[47px] w-[188px]' : '',
                  logo.url.endsWith('EtherFi.png') ? 'h-[56px] w-[114px]' : '',
                  logo.link ? 'cursor-pointer' : '',
                  logo.width,
                )}
                src={logo.url}
                alt={`Logo ${index + 1}`}
                key={`first-${index}`}
                onClick={() => logo.link && window.open(logo.link, '_blank')}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Ecosystem
