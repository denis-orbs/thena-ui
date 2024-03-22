import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'

import { TrailingButton } from '@/components/buttons/Button'
import { cn, goToDoc } from '@/lib/utils'

import { FeatureIllustration } from './FeatureIllustration'
import { IntroductionIllustration } from './IntroductionIllustration'
import { StakeAndEarn } from './StakeAndEarn'
import { ThenaCore } from './ThenaCore'
import { Heading } from '../../Common/Heading'
import HomeImage from '../../Common/HomeImage'

const features = ['introduction', 'stake_and_earn', 'thena_core']

function FeatureScroller({ setFeature, currentFeatureIndex }) {
  const containerRef = useRef(null)

  return (
    <div ref={containerRef} className='relative w-0.5 bg-[#231727]'>
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: `${currentFeatureIndex * 100}%` }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 260, damping: 25 }}
        className={cn('absolute w-full rounded-lg', 'bg-primary-600')}
        style={{
          height: `calc(100% / ${features.length})`,
        }}
      />
      {[...Array(features.length)].map((_, idx) => (
        <motion.div
          key={`scroller-${idx}`}
          onClick={() => setFeature(features[idx])}
          className={cn(
            'absolute w-full cursor-pointer',
            'before:absolute before:right-0 before:inline-block before:h-full before:w-8',
            'after:absolute after:left-0 after:inline-block after:h-full after:w-8',
          )}
          style={{
            height: `calc(100% / ${features.length})`,
            top: `${(idx / features.length) * 100}%`,
          }}
        />
      ))}
    </div>
  )
}

export function Features() {
  const [feature, setFeature] = useState(features[0])
  const { push } = useRouter()
  const t = useTranslations()

  const featuresInfo = {
    introduction: {
      heading: 'Spot and Leverage Trading',
      title: 'INTRODUCING THENA',
      description: 'Spot Description',
      buttonAction: '',
      background: '',
      label: 'Trade Now',
      action: () => {
        push('/swap')
      },
    },
    stake_and_earn: {
      heading: 'Stake and Earn',
      title: 'PASSIVE INCOME',
      description: 'Stake Description',
      buttonAction: '',
      label: 'Learn More',
      action: () => {
        goToDoc()
      },
    },
    thena_core: {
      heading: 'The Social Layer',
      title: 'SOCIALFI MEETS TRADING',
      description: 'Social Description',
      buttonAction: '',
      label: 'Coming Soon',
      action: () => {},
    },
  }

  return (
    <>
      {/* desktop view */}
      <div className='mt-24 hidden space-x-8 lg:flex'>
        <FeatureScroller setFeature={setFeature} currentFeatureIndex={features.findIndex(item => item === feature)} />

        <div
          id='feature-wrapper'
          className='bg-landing-page-gradient group relative flex w-full items-center justify-between gap-x-12 overflow-hidden rounded-3xl p-10 xl:gap-x-[115px] xl:p-20'
        >
          <div className='relative z-10 w-full max-w-[400px] flex-1'>
            <motion.div
              initial={{ opacity: 0, filter: 'blur(12px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.4, ease: 'linear' }}
              key={`${feature}-heading`}
            >
              <Heading
                headingExtraSytles='lg:text-4xl lg:leading-[40px] xl:text-[45px] xl:leading-[56px]'
                heading={t(featuresInfo[feature].heading)}
                title={t(featuresInfo[feature].title)}
              />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
              key={`${feature}-desc`}
              className='mt-4 leading-6 text-white/[0.35]'
            >
              {t(featuresInfo[feature].description)}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
              key={`${feature}-cta`}
            >
              <TrailingButton onClick={featuresInfo[feature].action} className='mt-10'>
                {t(featuresInfo[feature].label)}
              </TrailingButton>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, filter: 'blur(12px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            key={`${feature}-section`}
            className={cn('relative z-20 flex h-[410px] flex-1 flex-col', {
              'items-center justify-center': feature !== 'introduction',
            })}
          >
            <FeatureIllustration feature={feature} />
          </motion.div>
          {feature !== 'thena_core' && (
            <>
              <HomeImage
                alt='dotter grid'
                src='/images/home/stats/stats21.png'
                key={feature}
                className='absolute right-0 h-[600px] w-4/6 opacity-0 transition-opacity duration-[600ms] group-hover:opacity-100'
              />
              <div className='absolute right-[20%] h-[275px] w-[275px] rounded-full bg-fuchsia-600 bg-opacity-[35%] blur-[220px] filter' />
            </>
          )}
          <div className='absolute left-0 top-0 h-[275px] w-[275px] rounded-full bg-fuchsia-600 bg-opacity-[35%] blur-[220px] filter' />
          <div className='absolute bottom-0 right-0 h-[275px] w-[275px] rounded-full bg-fuchsia-600 bg-opacity-[35%] blur-[220px] filter' />
        </div>
      </div>

      {/* mobile view */}
      <div className='w-full lg:hidden'>
        {Object.keys(featuresInfo).map((data, idx) => {
          const item = featuresInfo[data]

          return (
            <div className={cn('py-12')} key={`${idx}-feature-mobile`}>
              <div className='relative z-10 w-full'>
                <Heading title={item.title} heading={item.heading} />
                <p className='pt-6 leading-6 text-white/[0.35]'>{item.description}</p>
              </div>
              <div className='relative mt-14 flex w-full flex-col items-center justify-center'>
                {item === featuresInfo.introduction && <IntroductionIllustration />}
                {item === featuresInfo.stake_and_earn && <StakeAndEarn noAnimation />}
                {item === featuresInfo.thena_core && <ThenaCore />}
                <div
                  className={cn(
                    'pointer-events-none absolute z-0 h-[161.071px] w-[161.071px] bg-fuchsia-600 opacity-[0.35] blur-[128px] filter',
                    idx === 2 ? 'hidden' : '',
                  )}
                />
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
