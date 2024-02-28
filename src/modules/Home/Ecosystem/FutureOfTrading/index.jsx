import { motion } from 'framer-motion'
import { useState } from 'react'

import { TrailingButton } from '@/components/buttons/Button'
import { cn } from '@/lib/utils'

import { TokenomicsIllustration } from './TokenomicsIllustration'
import { Heading } from '../../Common/Heading'
import HomeImage from '../../Common/HomeImage'

const tradingDataObject = {
  'THE system': {
    description:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry',
  },
  Tokenomics: {
    description:
      'THENA uses a self-optimizing ve3,3 based system designed to sustainably reward all contributing participants.',
  },
}

const codeHtml = `<p class=''><span class='text-[#2A72A4]'>const</span> siweConfig: SIWEConfig = </p>
  ...
  <p>
  verifyMessage:
  </p>
  <p><span class='text-[#2A72A4]'>async</span> ({ message, signature }) </p>
<span class='text-[#B27C3C]'>=></span> fetch('/api/siwe/verify', {<br>
  method: 'POST',<br>
  headers: {<br>
  '<span class='text-[#2A72A4]'>Content-Type</span>':&nbsp;<span class='text-[#1F9D1C]'>'application/json',</span><br>
  },<br>
  body: <span class='text-[#2A72A4]'>JSON</span>.stringify 
  <span class='text-[#B27C3C]'>({</span> message, signature <span class='text-[#B27C3C]'>})</span>,<br>
  }).then((res) <span class='text-[#B27C3C]'>=></span> res.ok),<br>
  ...<br>
  };`

const codeHtmlMobile = `<p>terraform {  <br>
  &nbsp; &nbsp; required_providers  { 
    <br>   &nbsp; &nbsp; &nbsp; aws = { 
      <br>     
      &nbsp; &nbsp; &nbsp; &nbsp; source  = "hashicorp/aws" <br>    
      &nbsp; &nbsp; &nbsp; &nbsp; version = "~> 4.0"  <br>  
      &nbsp; &nbsp; &nbsp;} <br>   
      &nbsp; &nbsp; &nbsp;abnhcsj = {   <br>   
        &nbsp; &nbsp; &nbsp; &nbsp;source = "Thena/Thena"  <br>  
        &nbsp; &nbsp; &nbsp;} <br> 
        &nbsp; &nbsp} <br>
} <br><br>variable "AWS_ACCESS_KEY_ID" {}</p>`

const prtocolsData = [
  {
    icon: '/images/home/stats/ec22.png',
    heading: 'Step 1',
    title: 'Request Gauge Whitelisting',
    description:
      'Protocols that seek to open a gauge to be voted on have to request a whitelisting by presenting a proposal.',
  },
  {
    icon: '/images/home/stats/ec23.png',
    heading: 'Step 2',
    title: 'Add a Voting Incentive',
    description:
      'Once the gauge has been initiated, anyone can add incentives with just a few clicks. The incentives are set per epoch, which lasts for 7 days.',
  },
  {
    icon: '/images/home/stats/ec24.png',
    heading: 'Step 3',
    title: 'Receive Emissions',
    description: 'The emissions are distributed to the gauges for the new epoch based on votes from veTHE holders.',
  },
]
export function FutureOfTrading() {
  const [tradingData, setTradingData] = useState('Tokenomics')

  return (
    <div className='mx-auto flex max-w-[1171px] flex-col items-center justify-center xl:flex-row xl:items-start xl:space-x-[151px]'>
      <div className='mt-24 flex w-full max-w-[313px] flex-col items-center justify-center lg:mt-[100px] lg:max-w-[368px] xl:items-start xl:justify-start '>
        <Heading
          heading='Collaborative Liquidity Layer'
          title='HOW IT WORKS'
          wrapperStyles='items-center xl:items-start'
          headingExtraSytles='text-center xl:text-start'
        />
        <p className='mt-6 text-center leading-6 text-white/[0.55] xl:text-start'>
          THENA is a community-driven decentralized exchange, powered by a self-optimizing ve3,3 model, serving BNB
          Chain projects with their liquidity needs.
        </p>
        <TrailingButton
          className='mt-7 lg:mt-12'
          onClick={() => {
            window.open('https://thena.gitbook.io/thena/the-tokenomics/initial-supply-and-emissions-schedule', '_blank')
          }}
        >
          Tokenomics
        </TrailingButton>
      </div>

      <div className='relative mt-7 flex h-full w-full max-w-[652px] items-center justify-center xl:mt-0'>
        <div className='stats-blob absolute h-[300px] w-[400px] rounded-full bg-opacity-[0.45] blur-[264px] filter' />
        <div className='w-full px-5 xl:px-0'>
          <div className='w-full rounded-[28px] border border-white/[0.06] bg-[rgba(56,47,65,0.06)] p-4 backdrop-blur-[20px]'>
            <div className='relative min-h-[682px] w-full overflow-hidden rounded-2xl border border-[#221222] bg-[rgba(10,5,11,0.7)] lg:min-h-[735px]'>
              <div className='relative z-10 flex w-full overflow-auto'>
                <div
                  onClick={() => {
                    setTradingData('Tokenomics')
                  }}
                  className={cn(
                    'flex min-w-[164px] flex-shrink-0 cursor-pointer items-center justify-center space-x-2 whitespace-nowrap px-12 py-4 md:w-1/2 md:min-w-fit xl:px-0',
                    tradingData !== 'Tokenomics' &&
                      `${
                        tradingData === 'THE system'
                          ? 'rounded-bl-2xl border-l-[#221222] border-r-transparent'
                          : 'rounded-br-2xl border-l-transparent border-r-[#221222]'
                      } border-b border-l border-r border-b-[#221222] bg-[#100913] text-white/[0.25]`,
                  )}
                >
                  <div className='flex h-6 w-6 flex-col items-center justify-center rounded-[5.143px] border border-white/[0.05] bg-white/[0.04]'>
                    <div
                      className={cn(
                        'relative flex h-[17.143px] w-[17.143px] flex-col items-center justify-center overflow-hidden rounded-[3.429px]',
                        tradingData === 'Tokenomics' ? 'relative bg-[#DF0ED5]' : 'bg-white/[0.12]',
                      )}
                    >
                      <div
                        className={cn(
                          'absolute bottom-0 h-2 w-full',
                          tradingData === 'Tokenomics' ? 'background-blur-fill opacity-1' : 'opacity-0',
                        )}
                      />
                      <svg width={10} height={12} viewBox='0 0 10 12' fill='none' xmlns='http://www.w3.org/2000/svg'>
                        <rect
                          x='0.713989'
                          y='5.57147'
                          width='1.71429'
                          height={6}
                          rx='0.857143'
                          fill='url(#paint0_linear_1794_7335)'
                          fillOpacity='1'
                        />
                        <rect
                          x='4.14258'
                          y='3.00006'
                          width='1.71429'
                          height='8.57143'
                          rx='0.857143'
                          fill='url(#paint1_linear_1794_7335)'
                          fillOpacity='1'
                        />
                        <rect
                          x='7.57117'
                          y='0.857178'
                          width='1.71429'
                          height='10.7143'
                          rx='0.857143'
                          fill='url(#paint2_linear_1794_7335)'
                          fillOpacity='1'
                        />
                        <defs>
                          <linearGradient
                            id='paint0_linear_1794_7335'
                            x1='1.57113'
                            y1='5.57147'
                            x2='1.57113'
                            y2='11.5715'
                            gradientUnits='userSpaceOnUse'
                          >
                            <stop stopColor='currentColor' />
                            <stop offset={1} stopColor='currentColor' stopOpacity='0.57' />
                          </linearGradient>
                          <linearGradient
                            id='paint1_linear_1794_7335'
                            x1='4.99972'
                            y1='3.00006'
                            x2='4.99972'
                            y2='11.5715'
                            gradientUnits='userSpaceOnUse'
                          >
                            <stop stopColor='currentColor' />
                            <stop offset={1} stopColor='currentColor' stopOpacity='0.57' />
                          </linearGradient>
                          <linearGradient
                            id='paint2_linear_1794_7335'
                            x1='8.42831'
                            y1='0.857178'
                            x2='8.42831'
                            y2='11.5715'
                            gradientUnits='userSpaceOnUse'
                          >
                            <stop stopColor='currentColor' />
                            <stop offset={1} stopColor='currentColor' stopOpacity='0.57' />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>
                  <span>THE Tokenomics</span>
                </div>
                <div
                  onClick={() => {
                    setTradingData('Protocols')
                  }}
                  className={cn(
                    'flex min-w-[164px] flex-shrink-0 cursor-pointer items-center justify-center space-x-2 whitespace-nowrap px-12 py-4 md:w-1/2 md:min-w-fit xl:px-0',
                    tradingData !== 'Protocols' &&
                      `${
                        tradingData === 'THE system' ? 'rounded-bl-none' : 'rounded-bl-2xl'
                      } rounded-tr-2xl border-b border-l border-[#221222] bg-[#100913] text-white/[0.25]`,
                  )}
                >
                  <div className='flex h-6 w-6 flex-col items-center justify-center rounded-[5.143px] border border-white/[0.05] bg-white/[0.04]'>
                    <div
                      className={cn(
                        'relative flex h-[17.143px] w-[17.143px] flex-col items-center justify-center overflow-hidden rounded-[3.429px]',
                        tradingData === 'Protocols' ? 'relative bg-[#DF0ED5]' : 'bg-white/[0.12]',
                      )}
                    >
                      <div
                        className={cn(
                          'absolute bottom-0 h-2 w-full',
                          tradingData === 'Protocols' ? 'background-blur-fill opacity-1' : 'opacity-0',
                        )}
                      />
                      <svg width={14} height={12} viewBox='0 0 14 12' fill='none' xmlns='http://www.w3.org/2000/svg'>
                        <path
                          fillRule='evenodd'
                          clipRule='evenodd'
                          d='M5.82157 0.646997C6.07858 0.510309 6.36999 0.438354 6.66663 0.438354C6.96326 0.438354 7.25467 0.510309 7.51168 0.646997L7.51298 0.64769L11.3046 2.64768C11.5123 2.75834 11.6915 2.90814 11.831 3.08666C11.8658 3.11954 11.8968 3.15692 11.9229 3.19854C11.9453 3.23424 11.9629 3.27127 11.976 3.309C12.0907 3.52326 12.1507 3.75938 12.151 3.99925V7.99983C12.1507 8.27383 12.0723 8.54352 11.9238 8.78075C11.7752 9.01797 11.5617 9.21496 11.3046 9.35197L11.3023 9.35322L7.51298 11.352L7.51169 11.3527C7.33624 11.446 7.14474 11.5091 6.94649 11.5398C6.86269 11.5799 6.76752 11.6025 6.66663 11.6025C6.56573 11.6025 6.47056 11.5799 6.38676 11.5398C6.18851 11.5091 5.99702 11.446 5.82156 11.3527L5.82027 11.352L2.03096 9.35321L2.02861 9.35197C1.77154 9.21496 1.55802 9.01797 1.40946 8.78075C1.26091 8.54352 1.18256 8.27441 1.18225 8.00041V3.99983C1.18252 3.7598 1.24268 3.52308 1.35746 3.30859C1.37055 3.271 1.38815 3.23411 1.41044 3.19854C1.43644 3.15706 1.46729 3.11979 1.50196 3.08699C1.64153 2.90832 1.82084 2.75841 2.02861 2.64769L2.03096 2.64644L5.82157 0.646997ZM7.276 10.1812L10.6953 8.37769L10.6962 8.37718C10.7678 8.33884 10.8272 8.28388 10.8686 8.21775C10.9101 8.15146 10.9321 8.07627 10.9323 7.99971L10.9323 4.37735L7.276 6.32967V10.1812ZM6.05725 6.32962V10.1813L2.63798 8.37769L2.63704 8.37718C2.56548 8.33885 2.50603 8.28388 2.46462 8.21775C2.42307 8.15139 2.40113 8.07613 2.401 7.99949V4.3773L6.05725 6.32962ZM6.9036 1.62197L10.3017 3.41437L6.66667 5.35536L3.0316 3.41435L6.4273 1.62322L6.42965 1.62197C6.5017 1.58357 6.58343 1.56335 6.66663 1.56335C6.74982 1.56335 6.83155 1.58357 6.9036 1.62197Z'
                          fill='currentColor'
                          fillOpacity='1'
                        />
                      </svg>
                    </div>
                  </div>
                  <span>Protocols</span>
                </div>
              </div>
              <div
                style={{
                  background: 'radial-gradient(74.35% 74.35% at 50% 50%, rgba(10, 5, 11, 0) 0%, #0A050B 100%)',
                }}
                className='pointer-events-none absolute inset-0 z-[9] h-full w-full'
              />
              <motion.span
                className='absolute inset-0 z-0 inline-block'
                animate={{
                  opacity: 0.9,
                }}
                initial={{
                  opacity: 0.4,
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  repeatType: 'reverse',
                }}
              >
                <HomeImage alt='dotted' src='/images/home/ecosystem/dots.png' className='h-full w-full' />
              </motion.span>
              <div className='relative z-10 rounded-2xl py-8 xl:p-10'>
                {tradingDataObject[tradingData]?.description && (
                  <div className='w-full px-6 xl:px-0'>
                    <div className='border-l-2 border-[#BE01B7] pl-5 font-medium leading-6 xl:text-xl xl:leading-7'>
                      {tradingDataObject[tradingData]?.description}
                    </div>
                  </div>
                )}
                <div
                  className={cn(
                    'relative z-10 flex flex-col items-center justify-center px-6 xl:px-0',
                    tradingData === 'Protocols' ? '' : 'mt-[33px] lg:mt-[38px]',
                  )}
                >
                  {tradingData === 'THE system' && (
                    <div className='w-full rounded-2xl bg-white/[0.02] px-5 py-[42px] xl:px-[65.5px] xl:py-[55px]'>
                      <p
                        className='font-aeonik-fono hidden leading-7 xl:block'
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{ __html: codeHtml }}
                      />
                      <p
                        className='font-aeonik-fono text-[13px] leading-6 xl:hidden'
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{ __html: codeHtmlMobile }}
                      />
                    </div>
                  )}
                  {tradingData === 'Tokenomics' && <TokenomicsIllustration />}
                  {tradingData === 'Protocols' && (
                    <div className='mt-5 flex w-full flex-col lg:space-y-6'>
                      {prtocolsData.map((item, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            'w-full',
                            idx === prtocolsData.length - 1
                              ? ''
                              : 'border-b border-[#211821] pb-7 lg:border-none lg:pb-8',
                          )}
                        >
                          <div
                            className={cn(
                              idx > 0 ? 'mt-7 lg:mt-0' : '',
                              'flex items-center space-x-12 xl:space-x-[60px]',
                            )}
                          >
                            <div className='relative !w-12 xl:w-full xl:min-w-[78px]'>
                              <div className='absolute -top-1 right-0 h-6 w-6 bg-[rgba(235,149,231,0.25)] opacity-[0.45] blur-md filter lg:-right-4 lg:w-[42px]' />
                              <div className='absolute bottom-1 right-0 h-3.5 w-3.5 bg-[rgba(234,0,229,0.45)] opacity-[0.45] blur-md filter lg:-right-2 lg:h-6 lg:w-6' />
                              <HomeImage alt='icon' className='w-full' src={item.icon} />
                            </div>
                            <div className='w-full max-w-[333px]'>
                              <Heading
                                titleExtraStyles='!text-sm !font-figtree'
                                headingExtraSytles='!text-base lg:!text-xl font-medium !leading-6 w-full'
                                title={item.heading}
                                heading={item.title}
                              />
                              <p className='mt-1 text-[13px] leading-5 text-white/[0.45] xl:text-sm'>
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
