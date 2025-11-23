/* eslint-disable react/no-danger */

'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import React, { memo, useCallback } from 'react'

import { SOCIAL_LINKS } from '@/constant'
import cn from '@/utils/classes'

import Logo from '~/logo.svg'

import NextImage from '../image/NextImage'

const AnimatedIcon = memo(({ externalLink, hoverData, icon, iconColored }) => (
  <a className='group relative' href={externalLink}>
    <div className='font-figtree absolute -top-6 left-[50%] translate-x-[-50%] transform rounded-xs bg-[#311530] px-2 py-1.5 text-base leading-4 whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:-top-12 group-hover:opacity-100'>
      <svg
        className='absolute -bottom-1 left-[50%] translate-x-[-50%] transform'
        width={9}
        height={4}
        viewBox='0 0 9 4'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path d='M4.5 4L0.5 0H8.5L4.5 4Z' fill='#311530' />
      </svg>
      <p dangerouslySetInnerHTML={{ __html: hoverData }} />
    </div>
    <NextImage
      alt='icon'
      src={icon}
      className='w-fit transition-all duration-500 ease-linear group-hover:h-0 group-hover:w-0 group-hover:opacity-0'
    />
    <NextImage
      alt='icon'
      src={iconColored}
      className='h-0 w-0 opacity-0 transition-all duration-500 ease-linear group-hover:h-auto group-hover:w-auto group-hover:opacity-100'
    />
  </a>
))
const footerLinks = [[], []]
// const footerLinks = [
//   [
//     {
//       link: 'About us',
//       url: '/',
//     },
//     {
//       link: 'Learn more',
//       url: '/',
//     },
//     {
//       link: 'THE story',
//       url: '/',
//     },
//   ],
//   [
//     {
//       link: 'Contact',
//       url: '/',
//     },
//     {
//       link: 'Terms of Service',
//       url: '/',
//     },
//     {
//       link: 'Privacy Policy',
//       url: '/',
//     },
//   ],
// ]
function Footer({ isHomePage = false }) {
  const { push } = useRouter()
  const t = useTranslations()

  const onLogoClick = useCallback(() => {
    push('/')
  }, [push])
  return (
    <>
      <div className='relative w-full'>
        <div
          className={cn(
            'footer relative mx-auto mt-28 max-w-[1152px] px-10 pt-10 pb-[184px] lg:mt-36 lg:pt-[58px] lg:pb-[269px] xl:px-0',
            !isHomePage ? 'mt-0 lg:mt-0' : '',
          )}
        >
          <NextImage alt='linear gradient line' src='/images/footer/linearGradientLine.svg' className='w-full' />
          <div className='relative z-10 w-full justify-between md:flex lg:pt-[70px]'>
            <div className='flex flex-col justify-between'>
              <div>
                <Logo className='h-6 w-[106px] cursor-pointer' onClick={() => onLogoClick()} />
                <p className='mt-4 text-xs leading-4 text-white/50'>
                  © {t('All rights reserved [year]', { year: new Date().getFullYear() })}
                </p>
              </div>
              <div className='mt-4 flex items-center gap-3 lg:mt-0'>
                {Object.values(SOCIAL_LINKS).map((item, idx) => (
                  <a
                    className='relative flex h-6 w-6 transform flex-col items-center justify-center transition-all duration-150 ease-in-out hover:scale-125'
                    key={idx}
                    href={item.url}
                    target='__blank'
                  >
                    <NextImage alt='svg' className='absolute w-fit' src={item.icon} />
                  </a>
                ))}
              </div>
            </div>
            <div className='mt-10 flex flex-col gap-10 lg:mt-0 lg:flex-row lg:gap-14'>
              <div className='flex gap-12'>
                <div className='flex flex-col gap-3 text-sm leading-5'>
                  {footerLinks[0].map((item, idx) => (
                    <span key={idx} className='text-white/80' onClick={() => push(item.url)}>
                      {item.link}
                    </span>
                  ))}
                </div>
                <div className='flex flex-col gap-3 text-sm leading-5'>
                  {footerLinks[1].map((item, idx) => (
                    <span key={idx} className='text-white/80' onClick={() => push(item.url)}>
                      {item.link}
                    </span>
                  ))}
                </div>
              </div>
              <div className='h-fit rounded-2xl bg-linear-to-b from-white/10 to-white/0 p-px'>
                <div
                  className='flex cursor-pointer items-center gap-3 rounded-2xl bg-[rgba(14,8,16,0.45)] p-6'
                  onClick={() => window.open(SOCIAL_LINKS.X.url, '_blank')}
                >
                  <NextImage className='w-fit' alt='linear gradient line' src='/images/footer/xbig.svg' />
                  <span className='text-sm leading-5'>{t('Follow us for More')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <NextImage
          alt='background'
          src='/images/footer/footerbg.png'
          className='absolute bottom-0 -z-10 hidden w-full md:block'
        />
        <NextImage
          alt='background'
          src='/images/footer/mobilebg.png'
          className='absolute bottom-0 h-full w-full md:hidden'
        />
      </div>
      <div className='fixed bottom-[37px] left-[50%] z-100 flex translate-x-[-50%] transform items-center gap-5 rounded-full border border-white/[0.04] bg-[rgba(41,25,47,0.20)] px-4 py-[11px] backdrop-blur-[20px] lg:hidden'>
        {Object.keys(SOCIAL_LINKS).map(item => (
          <AnimatedIcon
            externalLink={SOCIAL_LINKS[item].url}
            hoverData={item}
            icon={SOCIAL_LINKS[item].icon}
            iconColored={SOCIAL_LINKS[item].iconColored}
            key={item}
          />
        ))}
      </div>
    </>
  )
}

export default memo(Footer)
