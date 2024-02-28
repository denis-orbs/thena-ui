import { motion } from 'framer-motion'

export function CircularBg() {
  return (
    <svg width='368' height='376' viewBox='0 0 368 376' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <motion.circle
        opacity='0.15'
        cx='178.933'
        cy='177.5'
        r='176.933'
        fill='url(#paint0_linear_1597_1987)'
        stroke='url(#paint1_linear_1597_1987)'
        strokeWidth='1.13419'
        className='features-circle'
        initial={{
          opacity: 0,
        }}
      />
      <motion.circle
        opacity='0.25'
        cx='178.933'
        cy='177.758'
        r='137.236'
        fill='url(#paint2_linear_1597_1987)'
        stroke='url(#paint3_linear_1597_1987)'
        strokeWidth='1.13419'
        className='features-circle'
        initial={{
          opacity: 0,
        }}
      />
      <motion.circle
        opacity='0.35'
        cx='178.685'
        cy='177.612'
        r='99.1703'
        fill='url(#paint4_linear_1597_1987)'
        stroke='url(#paint5_linear_1597_1987)'
        strokeWidth='1.13419'
        className='features-circle'
        initial={{
          opacity: 0,
        }}
      />
      <motion.path
        d='M134.813 143V151.48H148.364C152.289 151.48 155.473 154.615 155.473 158.486V211.471H164.484V153.263H173.495V222H182.505V153.263H191.516V211.471H200.527V158.486C200.527 154.618 203.708 151.48 207.636 151.48H221.187V143H134.813Z'
        fill='white'
        fillOpacity='0.08'
        id='feature-thena-logo'
      />
      <g filter='url(#filter0_f_1597_1987)'>
        <circle cx='136.259' cy='136.675' r='52.8459' fill='#DC00D4' fillOpacity='0.68' />
      </g>
      <g filter='url(#filter1_f_1597_1987)'>
        <circle cx='218.877' cy='226.736' r='65.4992' fill='#6100DC' fillOpacity='0.44' />
      </g>
      <defs>
        <filter
          id='filter0_f_1597_1987'
          x='0.0504684'
          y='0.46624'
          width='272.417'
          height='272.417'
          filterUnits='userSpaceOnUse'
          colorInterpolationFilters='sRGB'
        >
          <feFlood floodOpacity='0' result='BackgroundImageFix' />
          <feBlend mode='normal' in='SourceGraphic' in2='BackgroundImageFix' result='shape' />
          <feGaussianBlur stdDeviation='41.6813' result='effect1_foregroundBlur_1597_1987' />
        </filter>
        <filter
          id='filter1_f_1597_1987'
          x='70.0156'
          y='77.8744'
          width='297.724'
          height='297.724'
          filterUnits='userSpaceOnUse'
          colorInterpolationFilters='sRGB'
        >
          <feFlood floodOpacity='0' result='BackgroundImageFix' />
          <feBlend mode='normal' in='SourceGraphic' in2='BackgroundImageFix' result='shape' />
          <feGaussianBlur stdDeviation='41.6813' result='effect1_foregroundBlur_1597_1987' />
        </filter>
        <linearGradient
          id='paint0_linear_1597_1987'
          x1='178.933'
          y1='0'
          x2='178.933'
          y2='355'
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#DC01D4' stopOpacity='0.12' />
          <stop offset='1' stopColor='#DC01D4' stopOpacity='0.06' />
        </linearGradient>
        <linearGradient
          id='paint1_linear_1597_1987'
          x1='178.933'
          y1='0'
          x2='178.933'
          y2='355'
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#DC01D4' stopOpacity='0.45' />
          <stop offset='1' stopColor='#DC01D4' stopOpacity='0.06' />
        </linearGradient>
        <linearGradient
          id='paint2_linear_1597_1987'
          x1='178.933'
          y1='39.9548'
          x2='178.933'
          y2='315.562'
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#DC01D4' stopOpacity='0.12' />
          <stop offset='1' stopColor='#DC01D4' stopOpacity='0.06' />
        </linearGradient>
        <linearGradient
          id='paint3_linear_1597_1987'
          x1='178.933'
          y1='39.9548'
          x2='178.933'
          y2='315.562'
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#DC01D4' stopOpacity='0.45' />
          <stop offset='1' stopColor='#DC01D4' stopOpacity='0.06' />
        </linearGradient>
        <linearGradient
          id='paint4_linear_1597_1987'
          x1='178.685'
          y1='77.8745'
          x2='178.685'
          y2='277.349'
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#DC01D4' stopOpacity='0.12' />
          <stop offset='1' stopColor='#DC01D4' stopOpacity='0.06' />
        </linearGradient>
        <linearGradient
          id='paint5_linear_1597_1987'
          x1='178.685'
          y1='77.8745'
          x2='178.685'
          y2='277.349'
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#DC01D4' stopOpacity='0.45' />
          <stop offset='1' stopColor='#DC01D4' stopOpacity='0.06' />
        </linearGradient>
      </defs>
    </svg>
  )
}
