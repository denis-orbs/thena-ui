/* eslint-disable react/no-danger */

'use client'

import { useRouter } from 'next/navigation'
import React from 'react'

import Logo from '~/logo.svg'

import NextImage from '../image/NextImage'

function AnimatedIcon({ externalLink, hoverData, icon, iconColored }) {
  return (
    <a className='group relative' href={externalLink}>
      <div className='font-figtree absolute -top-6 left-[50%] translate-x-[-50%] transform  whitespace-nowrap rounded bg-[#311530] px-2 py-1.5 text-base leading-4 opacity-0 transition-all duration-300 ease-in-out group-hover:-top-12 group-hover:opacity-100'>
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
  )
}

const footerSocialLinks = [
  {
    svg: '/images/footer/x.svg',
    url: 'https://twitter.com/ThenaFi_',
  },
  {
    svg: '/images/footer/vector.svg',
    url: 'https://medium.com/@ThenaFi',
  },
  {
    svg: '/images/footer/discord.svg',
    url: 'https://discord.gg/thena',
  },
  {
    svg: '/images/footer/telegram.svg',
    url: 'https://t.me/Thena_Fi',
  },
  {
    svg: '/images/footer/dinasour.svg',
    url: 'https://www.coingecko.com/en/coins/thena',
  },
]
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
function Footer() {
  const { push } = useRouter()

  const onLogoClick = () => {
    push('/')
  }
  return (
    <>
      <div className='relative w-full'>
        <div className='footer relative mx-auto mt-28 max-w-[1152px] px-10 pb-[184px] pt-10 lg:mt-36 lg:pb-[269px] lg:pt-[58px] xl:px-0'>
          <NextImage alt='linear gradient line' src='/images/footer/linearGradientLine.svg' className='w-full' />
          <div className='relative z-10 w-full justify-between md:flex lg:pt-[70px]'>
            <div className='flex flex-col justify-between'>
              <div>
                <Logo className='h-6 w-[106px] cursor-pointer' onClick={() => onLogoClick()} />
                <p className='mt-4 text-xs leading-4 text-white/50'>© 2024 THENA. All rights reserved.</p>
              </div>
              <div className='mt-4 flex items-center space-x-3 lg:mt-0'>
                {footerSocialLinks.map((item, idx) => (
                  <a
                    className='relative flex h-6 w-6 transform flex-col items-center justify-center transition-all duration-150 ease-in-out hover:scale-125'
                    key={idx}
                    href={item.url}
                    target='__blank'
                  >
                    <NextImage alt='svg' className='absolute w-fit' src={item.svg} />
                  </a>
                ))}
              </div>
            </div>
            <div className='mt-10 flex flex-col space-y-10 lg:mt-0 lg:flex-row lg:space-x-14 lg:space-y-0'>
              <div className='flex space-x-12'>
                <div className='flex flex-col space-y-3 text-sm leading-5'>
                  {footerLinks[0].map((item, idx) => (
                    <span key={idx} className=' text-white/80' onClick={() => push(item.url)}>
                      {item.link}
                    </span>
                  ))}
                </div>
                <div className='flex flex-col space-y-3 text-sm leading-5'>
                  {footerLinks[1].map((item, idx) => (
                    <span key={idx} className=' text-white/80' onClick={() => push(item.url)}>
                      {item.link}
                    </span>
                  ))}
                </div>
              </div>
              <div className='h-fit rounded-2xl bg-gradient-to-b from-white/10 to-white/0 p-px'>
                <div
                  className='flex cursor-pointer items-center space-x-3 rounded-2xl bg-[rgba(14,8,16,0.45)] p-6'
                  onClick={() => window.open('https://twitter.com/ThenaFi_', '_blank')}
                >
                  <NextImage className='w-fit' alt='linear gradient line' src='/images/footer/xbig.svg' />
                  <span className='text-sm leading-5'>Follow us for more</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <NextImage
          alt='background'
          src='/images/footer/footerbg.png'
          className='absolute bottom-0 hidden w-full md:block'
        />
        <NextImage
          alt='background'
          src='/images/footer/mobilebg.png'
          className='absolute bottom-0 h-full w-full md:hidden'
        />
      </div>
      <div className='fixed bottom-[37px] left-[50%] z-[100] flex translate-x-[-50%] transform items-center space-x-5 rounded-full border border-white/[0.04] bg-[rgba(41,25,47,0.20)] px-4 py-[11px] backdrop-blur-[20px] lg:hidden'>
        <AnimatedIcon
          externalLink='https://www.coingecko.com/en/coins/thena'
          /* eslint-disable */
          hoverData={`Coingecko`}
          /* eslint-enable */
          icon='/images/footer/dinasourmb.svg'
          iconColored='/images/footer/dinasourcolored.svg'
        />
        <AnimatedIcon
          externalLink='https://twitter.com/ThenaFi_'
          hoverData='X'
          icon='/images/footer/xmb.svg'
          iconColored='/images/footer/xcolored.svg'
        />
        <AnimatedIcon
          externalLink='https://discord.gg/thena'
          hoverData='Discord'
          icon='/images/footer/discordmb.svg'
          iconColored='/images/footer/discordcolored.svg'
        />
        <AnimatedIcon
          externalLink='https://medium.com/@ThenaFi'
          hoverData='Medium'
          icon='/images/footer/vectormb.svg'
          iconColored='/images/footer/vectorcolored.svg'
        />
        <AnimatedIcon
          externalLink='https://t.me/Thena_Fi'
          hoverData='Telegram'
          icon='/images/footer/telegrammb.svg'
          iconColored='/images/footer/telegramcolored.svg'
        />
      </div>
    </>
  )
}

export default Footer
