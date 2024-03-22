'use client'

import { useTranslations } from 'next-intl'
import React from 'react'
import { Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/pagination'

import { Heading } from './Common/Heading'
import HomeImage from './Common/HomeImage'

const cardsData = [
  {
    profilePic: '/images/home/scenes/Theseus.png',
    position: 'CEO & Co-Founder',
    name: 'Theseus',
    description:
      'DeFi native, self-appointed tokenomist. Started as a consultant in web3 back in early 2020, and quickly realized he wanted to build his own systems. Always keen on engaging with the citizens of THENA. Together we build.',
    svg: (
      <svg
        className='text-white/[0.35] transition-all duration-200 ease-in-out group-hover:text-white'
        width={28}
        height={28}
        viewBox='0 0 28 28'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path
          d='M7.03407 7L12.4393 14.7218L7 21H8.22427L12.9865 15.5032L16.8341 21H21L15.2905 12.8439L20.3534 7H19.1292L14.7436 12.0623L11.2 7H7.03407ZM8.8344 7.96341H10.7482L19.1994 20.0366H17.2856L8.8344 7.96341Z'
          fill='currentColor'
          fillOpacity='1'
        />
      </svg>
    ),
  },
  {
    profilePic: '/images/home/scenes/4pollo.png',
    position: 'CMO & Co-Founder',
    name: '0xApollo',
    description:
      'DeFi maven with over a decade of experience in various industries. Inspired by the god of truth and prophecy. Passionate about seeking higher knowledge. Claims to live in a simulation.',
    svg: (
      <svg
        className='text-white/[0.35] transition-all duration-200 ease-in-out group-hover:text-white'
        width={32}
        height={32}
        viewBox='0 0 32 32'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <g clipPath='url(#clip0_886_68584)'>
          <path
            d='M11.3253 9.90955C14.666 9.90955 17.374 12.6364 17.374 16C17.374 19.3636 14.6658 22.0902 11.3253 22.0902C7.98476 22.0902 5.27637 19.3636 5.27637 16C5.27637 12.6364 7.98456 9.90955 11.3253 9.90955ZM20.985 10.2663C22.6554 10.2663 24.0095 12.8331 24.0095 16H24.0097C24.0097 19.1661 22.6556 21.7337 20.9852 21.7337C19.3149 21.7337 17.9608 19.1661 17.9608 16C17.9608 12.8339 19.3146 10.2663 20.985 10.2663ZM25.6601 10.8635C26.2475 10.8635 26.7238 13.1632 26.7238 16C26.7238 18.836 26.2477 21.1365 25.6601 21.1365C25.0726 21.1365 24.5966 18.8366 24.5966 16C24.5966 13.1634 25.0728 10.8635 25.6601 10.8635Z'
            fill='currentColor'
            fillOpacity='1'
          />
        </g>
        <defs>
          <clipPath id='clip0_886_68584'>
            <rect width={32} height={32} rx={16} fill='currentColor' />
          </clipPath>
        </defs>
      </svg>
    ),
  },
  {
    profilePic: '/images/home/scenes/Xermes.png',
    position: 'Community Lead & Co-Founder',
    name: 'Xermes',
    description:
      'Enjoys turning chaos into functional organizations. Believes in direct communication, hates misinformation. Wandering around DeFi playgrounds for a while. Famous for herding the cats.',
    svg: (
      <svg
        className='text-white/[0.35] transition-all duration-200 ease-in-out group-hover:text-white'
        width={32}
        height={32}
        viewBox='0 0 32 32'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <g clipPath='url(#clip0_886_68585)'>
          <path
            d='M23.6361 9.33998C22.212 8.71399 20.6892 8.25903 19.0973 8C18.9018 8.33209 18.6734 8.77875 18.5159 9.13408C16.8236 8.89498 15.1469 8.89498 13.4857 9.13408C13.3283 8.77875 13.0946 8.33209 12.8974 8C11.3037 8.25903 9.77927 8.71565 8.35518 9.3433C5.48276 13.4213 4.70409 17.3981 5.09342 21.3184C6.99856 22.6551 8.84487 23.467 10.66 23.9983C11.1082 23.4189 11.5079 22.8029 11.8523 22.1536C11.1964 21.9195 10.5683 21.6306 9.9748 21.2951C10.1323 21.1856 10.2863 21.071 10.4351 20.9531C14.0551 22.5438 17.9881 22.5438 21.5649 20.9531C21.7154 21.071 21.8694 21.1856 22.0251 21.2951C21.4299 21.6322 20.8 21.9211 20.1442 22.1553C20.4885 22.8029 20.8865 23.4205 21.3364 24C23.1533 23.4687 25.0013 22.6567 26.9065 21.3184C27.3633 16.7738 26.1261 12.8335 23.6361 9.33998ZM12.3454 18.9075C11.2587 18.9075 10.3676 17.9543 10.3676 16.7937C10.3676 15.6331 11.2397 14.6783 12.3454 14.6783C13.4511 14.6783 14.3422 15.6314 14.3232 16.7937C14.325 17.9543 13.4511 18.9075 12.3454 18.9075ZM19.6545 18.9075C18.5678 18.9075 17.6767 17.9543 17.6767 16.7937C17.6767 15.6331 18.5488 14.6783 19.6545 14.6783C20.7602 14.6783 21.6514 15.6314 21.6323 16.7937C21.6323 17.9543 20.7602 18.9075 19.6545 18.9075Z'
            fill='currentColor'
            fillOpacity='1'
          />
        </g>
        <defs>
          <clipPath id='clip0_886_68585'>
            <rect width={32} height={32} rx={16} fill='currentColor' />
          </clipPath>
        </defs>
      </svg>
    ),
  },
  {
    profilePic: '/images/home/scenes/Theonysus.png',
    position: 'Business Development Lead & Co-Founder',
    name: 'Theonysus',
    description:
      'Son of Zeus and a Thenian, Theonysus studied the ancient economics and worked in the banking industry within the realm of gods. Keen to renew with his maternal roots and aware of the revolution, he left the realm to serve THENA.',
    svg: (
      <svg
        className='text-white/[0.35] transition-all duration-200 ease-in-out group-hover:text-white'
        width={32}
        height={32}
        viewBox='0 0 32 32'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <g clipPath='url(#clip0_886_68588)'>
          <path
            d='M24.2685 10.436C24.4288 9.38396 23.4442 8.55357 22.5234 8.96427L4.18341 17.1443C3.52308 17.4388 3.57138 18.4549 4.25624 18.6765L8.0384 19.9C8.76025 20.1335 9.54189 20.0128 10.1722 19.5704L18.6993 13.5857C18.9565 13.4052 19.2367 13.7766 19.017 14.0067L12.8791 20.4355C12.2837 21.0591 12.4018 22.1158 13.118 22.5721L19.9902 26.95C20.7609 27.441 21.7525 26.9477 21.8967 26.0015L24.2685 10.436Z'
            fill='currentColor'
            fillOpacity='1'
          />
        </g>
        <defs>
          <clipPath id='clip0_886_68588'>
            <rect width={32} height={32} rx={16} fill='currentColor' />
          </clipPath>
        </defs>
      </svg>
    ),
  },
  {
    profilePic: '/images/home/scenes/Prometheus.png',
    position: 'CTO & Co-Founder',
    name: 'Prometheus',
    description:
      'Security minded master of smart contract engineering. Best known for defying the gods by stealing fire from them and giving it to humanity in the form of technology, knowledge, and civilization. He is also credited with the creation of humanity from clay.',
    svg: (
      <svg
        className='text-white/[0.35] transition-all duration-200 ease-in-out group-hover:text-white'
        width={32}
        height={32}
        viewBox='0 0 32 32'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <g clipPath='url(#clip0_886_68590)'>
          <path
            fillRule='evenodd'
            clipRule='evenodd'
            d='M7.40994 21.7132C7.88174 20.6756 8.43223 18.8611 8.43223 16.508C8.43223 12.6477 10.8195 9.60003 15.5433 10.2604L16.3052 10.4127C16.9656 10.091 18.4386 9.83368 19.0481 11.3778C20.8259 11.6656 24.3916 12.7188 24.4322 14.6286C24.4616 16.0095 23.0293 17.5265 21.5708 19.0712C20.5079 20.1969 19.431 21.3374 18.8957 22.4508C18.1575 23.9864 17.911 25.3109 17.8639 26.1476C22.6714 25.2704 26.3158 21.0608 26.3158 16C26.3158 10.3029 21.6974 5.68444 16.0002 5.68444C10.3031 5.68444 5.68469 10.3029 5.68469 16C5.68469 18.113 6.31997 20.0775 7.40994 21.7132ZM7.04805 22.3935C5.75892 20.5917 5.00024 18.3844 5.00024 16C5.00024 9.92487 9.92511 5 16.0002 5C22.0754 5 27.0002 9.92487 27.0002 16C27.0002 21.4357 23.0576 25.9505 17.8759 26.8407C17.8772 26.8507 17.8785 26.8604 17.8799 26.8699C16.6062 27.2354 14.0691 27.3183 11.3405 25.9672C10.0209 25.3492 8.84416 24.4768 7.87342 23.4132C7.58214 23.1153 7.29389 22.7949 7.01001 22.4508C7.02238 22.4327 7.03506 22.4136 7.04805 22.3935Z'
            fill='currentColor'
            fillOpacity='1'
          />
          <path
            d='M16.7623 13.4095C16.7623 14.6438 15.7617 15.6444 14.5274 15.6444C13.2931 15.6444 12.2925 14.6438 12.2925 13.4095C12.2925 12.1752 13.2931 11.1746 14.5274 11.1746C15.7617 11.1746 16.7623 12.1752 16.7623 13.4095Z'
            fill='#070408'
          />
          <path
            d='M16.0513 13.4096C16.0513 14.2511 15.369 14.9334 14.5275 14.9334C13.6859 14.9334 13.0037 14.2511 13.0037 13.4096C13.0037 12.568 13.6859 11.8857 14.5275 11.8857C15.369 11.8857 16.0513 12.568 16.0513 13.4096Z'
            fill='currentColor'
            fillOpacity='1'
          />
          <path
            d='M22.3493 15.3905C22.3493 15.643 22.1447 15.8476 21.8922 15.8476C21.6397 15.8476 21.4351 15.643 21.4351 15.3905C21.4351 15.138 21.6397 14.9333 21.8922 14.9333C22.1447 14.9333 22.3493 15.138 22.3493 15.3905Z'
            fill='#070408'
          />
          <path
            d='M23.4669 16.8635C22.0277 17.5577 18.55 18.7124 16.1526 17.7778C17.0161 18.4889 19.6878 19.3016 23.4669 16.8635Z'
            fill='#070408'
          />
        </g>
        <defs>
          <clipPath id='clip0_886_68590'>
            <rect width={32} height={32} rx={16} fill='currentColor' />
          </clipPath>
        </defs>
      </svg>
    ),
  },
  {
    profilePic: '/images/home/scenes/Hyperion.png',
    position: 'Full Stack Developer & Co-Founder',
    name: 'Hyperion',
    description:
      'A wizard of all things web, now building THENA inside and out. Stacking sats with the gods since the birth of Bitcoin.',
    svg: (
      <svg
        className='text-white/[0.35] transition-all duration-200 ease-in-out group-hover:text-white'
        width={28}
        height={28}
        viewBox='0 0 28 28'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path
          d='M7.03407 7L12.4393 14.7218L7 21H8.22427L12.9865 15.5032L16.8341 21H21L15.2905 12.8439L20.3534 7H19.1292L14.7436 12.0623L11.2 7H7.03407ZM8.8344 7.96341H10.7482L19.1994 20.0366H17.2856L8.8344 7.96341Z'
          fill='currentColor'
          fillOpacity='1'
        />
      </svg>
    ),
  },
  {
    profilePic: '/images/home/scenes/Morpheus.png',
    position: 'Strategic Advisor & Co-Founder',
    name: 'Morpheus',
    description:
      'Web3 native, founder & advisor. Morpheus is the ancient Greek god of dreams. The myth says that he would appear in people’s dreams and convey messages from the Thenian gods.',
    svg: (
      <svg
        className='text-white/[0.35] transition-all duration-200 ease-in-out group-hover:text-white'
        width={32}
        height={32}
        viewBox='0 0 32 32'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <g clipPath='url(#clip0_886_68584)'>
          <path
            d='M11.3253 9.90955C14.666 9.90955 17.374 12.6364 17.374 16C17.374 19.3636 14.6658 22.0902 11.3253 22.0902C7.98476 22.0902 5.27637 19.3636 5.27637 16C5.27637 12.6364 7.98456 9.90955 11.3253 9.90955ZM20.985 10.2663C22.6554 10.2663 24.0095 12.8331 24.0095 16H24.0097C24.0097 19.1661 22.6556 21.7337 20.9852 21.7337C19.3149 21.7337 17.9608 19.1661 17.9608 16C17.9608 12.8339 19.3146 10.2663 20.985 10.2663ZM25.6601 10.8635C26.2475 10.8635 26.7238 13.1632 26.7238 16C26.7238 18.836 26.2477 21.1365 25.6601 21.1365C25.0726 21.1365 24.5966 18.8366 24.5966 16C24.5966 13.1634 25.0728 10.8635 25.6601 10.8635Z'
            fill='currentColor'
            fillOpacity='1'
          />
        </g>
        <defs>
          <clipPath id='clip0_886_68584'>
            <rect width={32} height={32} rx={16} fill='currentColor' />
          </clipPath>
        </defs>
      </svg>
    ),
  },
]
function Scenes() {
  const t = useTranslations()

  return (
    <div className='relative w-full lg:pb-[130px]'>
      <HomeImage alt='background' src='/images/home/scenes/bg.png' className='absolute top-0 w-full' />
      <div className='container relative z-20 mx-auto flex flex-col items-center justify-center pb-8 lg:pb-20'>
        <HomeImage className='mb-6 w-fit' alt='scenes' src='/images/home/scenes/1.png' />
        <Heading heading={t('Behind THE Scenes')} wrapperStyles='items-center' title={t('FOUNDERS')} />
      </div>
      {/*  */}
      <div className='3xl:max-w-[2000px] relative ml-auto w-full max-w-[1320px] pl-10 xl:px-0 2xl:max-w-[1520px]'>
        <Swiper
          breakpoints={{
            320: {
              slidesPerView: 1.1,
              spaceBetween: 12,
            },
            480: {
              slidesPerView: 2,
              spaceBetween: 12,
            },
            1280: {
              slidesPerView: 3.2,
              spaceBetween: 24,
            },
            1536: {
              slidesPerView: 3.75,
              spaceBetween: 24,
            },
            1920: {
              slidesPerView: 4,
              spaceBetween: 24,
            },
            2160: {
              slidesPerView: 4.5,
              spaceBetween: 24,
            },
          }}
          pagination
          modules={[Pagination]}
          grabCursor
          className='scenes-swiper !w-full !pb-20 lg:!pb-0'
        >
          {cardsData.map((item, idx) => (
            <SwiperSlide key={idx} className='w-full'>
              <div className='group relative z-10 overflow-hidden rounded-xl  bg-transparent p-px transition-opacity after:absolute after:left-0 after:top-0 after:h-full  after:w-full after:bg-gradient-to-b after:from-[#BE01B7]/[0.35] after:to-transparent after:opacity-0 after:transition-opacity after:duration-300 after:ease-linear after:content-[""] hover:after:opacity-100'>
                <div className='relative z-20 !min-h-[286px] rounded-xl bg-[#1A0D1F]/[0.45] px-9 py-8 transition-all duration-300 ease-in-out group-hover:bg-[#1A0D1F]/[0.98]'>
                  <div className='flex items-start justify-between transition-all duration-300 ease-in-out group-hover:-mt-1'>
                    <div className='flex items-start space-x-5'>
                      <HomeImage className='h-10 w-10' alt={`profile of ${item.name}`} src={item.profilePic} />
                      <div className=''>
                        <p className='text-xl font-semibold leading-6 tracking-[-0.8px]'>{item.name}</p>
                        <p className='text-base leading-6 tracking-[-0.48px] text-[#3AAFF8]'>{t(item.position)}</p>
                      </div>
                    </div>
                  </div>
                  <p className='mt-8 text-base leading-6 tracking-[-0.48px] text-white/[0.45] transition-all duration-300 ease-in-out group-hover:mt-7 group-hover:text-white'>
                    {t(item.name)}
                  </p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  )
}

export default Scenes
