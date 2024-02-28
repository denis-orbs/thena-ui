'use client'

import { cubicBezier, motion, useAnimate, useInView } from 'framer-motion'
import { useEffect } from 'react'

const ease = p => cubicBezier(0.33, 0.8, 0.69, 0.99)(p)

export function Illustration() {
  const [scope, animate] = useAnimate()

  const isInView = useInView(scope)

  useEffect(() => {
    if (!isInView) return

    animate(
      '#thena-logo',
      { opacity: [1, 0.4, 1], y: [0, 20, 0] },
      {
        duration: 3,
        repeat: Infinity,
        ease,
        repeatDelay: 1,
      },
    )

    // animating circles
    animate(
      '.circle:nth-child(1)',
      { opacity: [0.35, 0, 0.35], scale: [1, 0.8, 1] },
      { duration: 3, repeat: Infinity, ease, repeatDelay: 1 },
    )
    animate(
      '.circle:nth-child(2)',
      { opacity: [0.4, 0, 0.4], scale: [1, 0.8, 1] },
      { duration: 3, repeat: Infinity, ease, repeatDelay: 1 },
    )
    animate(
      '.circle:nth-child(3)',
      { opacity: [0.85, 0, 0.85], scale: [1, 0.8, 1] },
      { duration: 3, repeat: Infinity, ease, repeatDelay: 1 },
    )
    animate(
      '.circle:nth-child(4)',
      { opacity: [1, 0, 1], scale: [1, 0.8, 1] },
      { duration: 3, repeat: Infinity, ease, repeatDelay: 1 },
    )

    // star-lights
    animate(
      '.star-light-1',
      { opacity: [1, 0, 1], scale: [1, 0.8, 1], y: [0, 10, 0], x: [0, -20, 0] },
      { duration: 3, repeat: Infinity, ease, repeatDelay: 1 },
    )
    animate(
      '.star-light-2',
      { opacity: [0.65, 0, 0.65], scale: [1, 0.8, 1], y: [0, 10, 0], x: [0, 20, 0] },
      { duration: 3, repeat: Infinity, ease, repeatDelay: 1 },
    )
    animate(
      '.star-light-3',
      { opacity: [0.43, 0, 0.43], scale: [1, 0.8, 1], y: [0, 20, 0], x: [0, 20, 0] },
      { duration: 3, repeat: Infinity, ease, repeatDelay: 1 },
    )
    animate(
      '.star-light-4',
      { opacity: [0.56, 0, 0.56], scale: [1, 0.8, 1], y: [0, 10, 0], x: [0, -20, 0] },
      { duration: 3, repeat: Infinity, ease, repeatDelay: 1 },
    )
    animate(
      '.star-light-5',
      { opacity: [0.56, 0, 0.45], scale: [1, 0.8, 1], y: [0, 10, 0], x: [0, 20, 0] },
      { duration: 3, repeat: Infinity, ease, repeatDelay: 1 },
    )
    animate(
      '.star-light-6',
      { opacity: [0.56, 0, 0.56], scale: [1, 0.8, 1], y: [0, 10, 0], x: [0, -20, 0] },
      { duration: 3, repeat: Infinity, ease, repeatDelay: 1 },
    )
    animate(
      '.star-light-7',
      { opacity: [0.56, 0, 0.56], scale: [1, 0.8, 1], y: [0, 10, 0], x: [0, 20, 0] },
      { duration: 3, repeat: Infinity, ease, repeatDelay: 1 },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView])

  return (
    <svg
      ref={scope}
      width='442'
      height='442'
      className='h-[372px] w-[372px] md:h-[442px] md:w-[442px]'
      viewBox='0 0 442 442'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <g filter='url(#filter0_f_1106_7332)'>
        <circle cx='221' cy='221' r='50' fill='#DC00D4' fillOpacity='0.45' />
      </g>
      <motion.path
        d='M193.804 197.998V203.404H202.354C204.83 203.404 206.839 205.402 206.839 207.869V241.643H212.524V204.54H218.209V248.354H223.894V204.54H229.579V241.643H235.264V207.869C235.264 205.404 237.271 203.404 239.75 203.404H248.299V197.998H193.804Z'
        fill='#DC00D4'
        initial={{ opacity: 0, y: 0 }}
        id='thena-logo'
      />
      <mask
        id='mask0_1106_7332'
        style={{
          maskType: 'alpha',
        }}
        maskUnits='userSpaceOnUse'
        x='0'
        y='0'
        width='442'
        height='442'
      >
        <rect width='442' height='442' fill='url(#paint0_linear_1106_7332)' />
      </mask>
      <g mask='url(#mask0_1106_7332)'>
        <motion.circle
          initial={{ opacity: 0, scale: 1 }}
          className='circle'
          opacity='0.35'
          cx='221'
          cy='221'
          r='220.087'
          fill='url(#paint1_linear_1106_7332)'
          stroke='url(#paint2_linear_1106_7332)'
          strokeWidth='1.82645'
        />
        <motion.circle
          initial={{ opacity: 0, scale: 1 }}
          className='circle'
          opacity='0.4'
          cx='221'
          cy='221'
          r='165.314'
          fill='url(#paint3_linear_1106_7332)'
          stroke='url(#paint4_linear_1106_7332)'
          strokeWidth='1.3719'
        />
        <motion.circle
          initial={{ opacity: 0, scale: 1 }}
          className='circle'
          opacity='0.85'
          cx='221'
          cy='221'
          r='106.558'
          fill='url(#paint5_linear_1106_7332)'
          stroke='url(#paint6_linear_1106_7332)'
          strokeWidth='0.884298'
        />
        <motion.circle
          initial={{ opacity: 0, scale: 1 }}
          className='circle'
          cx='221'
          cy='221'
          r='60.5'
          fill='url(#paint7_linear_1106_7332)'
          stroke='url(#paint8_linear_1106_7332)'
        />
        <g filter='url(#filter1_f_1106_7332)'>
          <circle cx='221' cy='221' r='18' fill='#DC00D4' />
        </g>
        <motion.g
          style={{
            mixBlendMode: 'lighten',
          }}
          className='star-light-1'
          initial={{ opacity: 1, scale: 0 }}
        >
          <path
            style={{
              mixBlendMode: 'lighten',
            }}
            d='M24.0806 55.9984C27.9466 55.9984 31.0806 52.8647 31.0806 48.9992C31.0806 45.1336 27.9466 42 24.0806 42C20.2146 42 17.0806 45.1336 17.0806 48.9992C17.0806 52.8647 20.2146 55.9984 24.0806 55.9984Z'
            fill='url(#paint9_radial_1106_7332)'
          />
          <path
            d='M24.0808 50.441C24.8773 50.441 25.5229 49.7955 25.5229 48.9991C25.5229 48.2027 24.8773 47.5571 24.0808 47.5571C23.2843 47.5571 22.6387 48.2027 22.6387 48.9991C22.6387 49.7955 23.2843 50.441 24.0808 50.441Z'
            fill='#FFC5FA'
          />
        </motion.g>
        <motion.g
          style={{
            mixBlendMode: 'lighten',
          }}
          opacity='0.65'
          initial={{ opacity: 0, scale: 1 }}
          className='star-light-2'
        >
          <path
            style={{
              mixBlendMode: 'lighten',
            }}
            d='M452.581 203.997C460.036 203.997 466.081 197.953 466.081 190.498C466.081 183.043 460.036 177 452.581 177C445.125 177 439.081 183.043 439.081 190.498C439.081 197.953 445.125 203.997 452.581 203.997Z'
            fill='url(#paint10_radial_1106_7332)'
          />
        </motion.g>
        <motion.g
          style={{
            mixBlendMode: 'lighten',
          }}
          opacity='0.43'
          className='star-light-3'
          initial={{ opacity: 0, scale: 1 }}
        >
          <path
            style={{
              mixBlendMode: 'lighten',
            }}
            d='M232.038 25.9135C235.328 25.9135 237.995 23.2466 237.995 19.9567C237.995 16.6669 235.328 14 232.038 14C228.748 14 226.081 16.6669 226.081 19.9567C226.081 23.2466 228.748 25.9135 232.038 25.9135Z'
            fill='url(#paint11_radial_1106_7332)'
          />
          <path
            d='M232.038 21.1848C232.716 21.1848 233.266 20.635 233.266 19.9568C233.266 19.2786 232.716 18.7288 232.038 18.7288C231.36 18.7288 230.81 19.2786 230.81 19.9568C230.81 20.635 231.36 21.1848 232.038 21.1848Z'
            fill='white'
          />
        </motion.g>
        <motion.g
          style={{
            mixBlendMode: 'lighten',
          }}
          opacity='0.56'
          initial={{ opacity: 0, scale: 1 }}
          className='star-light-4'
        >
          <path
            style={{
              mixBlendMode: 'lighten',
            }}
            d='M41.038 167.913C44.3282 167.913 46.9954 165.247 46.9954 161.957C46.9954 158.667 44.3282 156 41.038 156C37.7478 156 35.0806 158.667 35.0806 161.957C35.0806 165.247 37.7478 167.913 41.038 167.913Z'
            fill='url(#paint12_radial_1106_7332)'
          />
          <path
            d='M41.0382 163.185C41.7165 163.185 42.2664 162.635 42.2664 161.957C42.2664 161.279 41.7165 160.729 41.0382 160.729C40.3599 160.729 39.8101 161.279 39.8101 161.957C39.8101 162.635 40.3599 163.185 41.0382 163.185Z'
            fill='white'
          />
        </motion.g>
        <motion.g
          style={{
            mixBlendMode: 'lighten',
          }}
          opacity='0.45'
          className='star-light-5'
          initial={{ opacity: 0, scale: 1 }}
        >
          <path
            style={{
              mixBlendMode: 'lighten',
            }}
            d='M387.248 37.3314C396.177 37.3314 403.416 30.0937 403.416 21.1657C403.416 12.2376 396.177 5 387.248 5C378.319 5 371.081 12.2376 371.081 21.1657C371.081 30.0937 378.319 37.3314 387.248 37.3314Z'
            fill='url(#paint13_radial_1106_7332)'
          />
          <path
            d='M387.248 24.5014C389.091 24.5014 390.584 23.0079 390.584 21.1656C390.584 19.3233 389.091 17.8298 387.248 17.8298C385.406 17.8298 383.912 19.3233 383.912 21.1656C383.912 23.0079 385.406 24.5014 387.248 24.5014Z'
            fill='#FFB0F8'
          />
        </motion.g>
        <motion.g
          style={{
            mixBlendMode: 'lighten',
          }}
          opacity='0.56'
          initial={{ opacity: 0, scale: 1 }}
          className='star-light-6'
        >
          <path
            style={{
              mixBlendMode: 'lighten',
            }}
            d='M120.038 80.9135C123.328 80.9135 125.995 78.2466 125.995 74.9567C125.995 71.6669 123.328 69 120.038 69C116.748 69 114.081 71.6669 114.081 74.9567C114.081 78.2466 116.748 80.9135 120.038 80.9135Z'
            fill='url(#paint14_radial_1106_7332)'
          />
          <path
            d='M120.038 76.1848C120.717 76.1848 121.266 75.635 121.266 74.9568C121.266 74.2786 120.717 73.7288 120.038 73.7288C119.36 73.7288 118.81 74.2786 118.81 74.9568C118.81 75.635 119.36 76.1848 120.038 76.1848Z'
            fill='white'
          />
        </motion.g>
        <motion.g
          style={{
            mixBlendMode: 'lighten',
          }}
          opacity='0.56'
          initial={{ opacity: 0, scale: 1 }}
          className='star-light-7'
        >
          <path
            style={{
              mixBlendMode: 'lighten',
            }}
            d='M374.038 203.913C377.328 203.913 379.995 201.247 379.995 197.957C379.995 194.667 377.328 192 374.038 192C370.748 192 368.081 194.667 368.081 197.957C368.081 201.247 370.748 203.913 374.038 203.913Z'
            fill='url(#paint15_radial_1106_7332)'
          />
          <path
            d='M374.038 199.185C374.717 199.185 375.266 198.635 375.266 197.957C375.266 197.279 374.717 196.729 374.038 196.729C373.36 196.729 372.81 197.279 372.81 197.957C372.81 198.635 373.36 199.185 374.038 199.185Z'
            fill='white'
          />
        </motion.g>
      </g>
      <defs>
        <filter
          id='filter0_f_1106_7332'
          x='51'
          y='51'
          width='340'
          height='340'
          filterUnits='userSpaceOnUse'
          colorInterpolationFilters='sRGB'
        >
          <feFlood floodOpacity='0' result='BackgroundImageFix' />
          <feBlend mode='normal' in='SourceGraphic' in2='BackgroundImageFix' result='shape' />
          <feGaussianBlur stdDeviation='60' result='effect1_foregroundBlur_1106_7332' />
        </filter>
        <filter
          id='filter1_f_1106_7332'
          x='147'
          y='147'
          width='148'
          height='148'
          filterUnits='userSpaceOnUse'
          colorInterpolationFilters='sRGB'
        >
          <feFlood floodOpacity='0' result='BackgroundImageFix' />
          <feBlend mode='normal' in='SourceGraphic' in2='BackgroundImageFix' result='shape' />
          <feGaussianBlur stdDeviation='28' result='effect1_foregroundBlur_1106_7332' />
        </filter>
        <linearGradient id='paint0_linear_1106_7332' x1='221' y1='0' x2='221' y2='273' gradientUnits='userSpaceOnUse'>
          <stop stopColor='#D9D9D9' />
          <stop offset='1' stopColor='#D9D9D9' stopOpacity='0' />
        </linearGradient>
        <linearGradient id='paint1_linear_1106_7332' x1='221' y1='0' x2='221' y2='442' gradientUnits='userSpaceOnUse'>
          <stop stopColor='#DC01D4' stopOpacity='0.12' />
          <stop offset='1' stopColor='#DC01D4' stopOpacity='0.06' />
        </linearGradient>
        <linearGradient id='paint2_linear_1106_7332' x1='221' y1='0' x2='221' y2='442' gradientUnits='userSpaceOnUse'>
          <stop stopColor='#DC01D4' stopOpacity='0.15' />
          <stop offset='1' stopColor='#DC01D4' stopOpacity='0.06' />
        </linearGradient>
        <linearGradient id='paint3_linear_1106_7332' x1='221' y1='55' x2='221' y2='387' gradientUnits='userSpaceOnUse'>
          <stop stopColor='#DC01D4' stopOpacity='0.12' />
          <stop offset='1' stopColor='#DC01D4' stopOpacity='0.06' />
        </linearGradient>
        <linearGradient id='paint4_linear_1106_7332' x1='221' y1='55' x2='221' y2='387' gradientUnits='userSpaceOnUse'>
          <stop stopColor='#DC01D4' stopOpacity='0.15' />
          <stop offset='1' stopColor='#DC01D4' stopOpacity='0.06' />
        </linearGradient>
        <linearGradient id='paint5_linear_1106_7332' x1='221' y1='114' x2='221' y2='328' gradientUnits='userSpaceOnUse'>
          <stop stopColor='#DC01D4' stopOpacity='0.12' />
          <stop offset='1' stopColor='#DC01D4' stopOpacity='0.06' />
        </linearGradient>
        <linearGradient id='paint6_linear_1106_7332' x1='221' y1='114' x2='221' y2='328' gradientUnits='userSpaceOnUse'>
          <stop stopColor='#DC01D4' stopOpacity='0.15' />
          <stop offset='1' stopColor='#DC01D4' stopOpacity='0.06' />
        </linearGradient>
        <linearGradient id='paint7_linear_1106_7332' x1='221' y1='160' x2='221' y2='282' gradientUnits='userSpaceOnUse'>
          <stop stopColor='#DC01D4' stopOpacity='0.12' />
          <stop offset='1' stopColor='#DC01D4' stopOpacity='0.06' />
        </linearGradient>
        <linearGradient id='paint8_linear_1106_7332' x1='221' y1='160' x2='221' y2='282' gradientUnits='userSpaceOnUse'>
          <stop stopColor='#DC01D4' stopOpacity='0.15' />
          <stop offset='1' stopColor='#DC01D4' stopOpacity='0.06' />
        </linearGradient>
        <radialGradient
          id='paint9_radial_1106_7332'
          cx='0'
          cy='0'
          r='1'
          gradientUnits='userSpaceOnUse'
          gradientTransform='translate(24.0806 48.9992) scale(7 6.99918)'
        >
          <stop offset='0.15' stopColor='#D67BCE' stopOpacity='0.8' />
          <stop offset='0.26' stopColor='#A861A3' stopOpacity='0.84' />
          <stop offset='0.42' stopColor='#6F416E' stopOpacity='0.9' />
          <stop offset='0.57' stopColor='#422744' stopOpacity='0.94' />
          <stop offset='0.71' stopColor='#221526' stopOpacity='0.97' />
          <stop offset='0.84' stopColor='#0F0A14' stopOpacity='0.99' />
          <stop offset='0.94' stopColor='#08060E' />
          <stop offset='1' stopColor='#07060D' />
        </radialGradient>
        <radialGradient
          id='paint10_radial_1106_7332'
          cx='0'
          cy='0'
          r='1'
          gradientUnits='userSpaceOnUse'
          gradientTransform='translate(452.581 190.498) scale(13.5 13.4984)'
        >
          <stop offset='0.15' stopColor='#D67BCE' stopOpacity='0.8' />
          <stop offset='0.16' stopColor='#D279CA' stopOpacity='0.8' />
          <stop offset='0.26' stopColor='#9C5A98' stopOpacity='0.86' />
          <stop offset='0.36' stopColor='#6E406D' stopOpacity='0.9' />
          <stop offset='0.46' stopColor='#492B4A' stopOpacity='0.94' />
          <stop offset='0.57' stopColor='#2C1B2F' stopOpacity='0.96' />
          <stop offset='0.69' stopColor='#170F1C' stopOpacity='0.98' />
          <stop offset='0.83' stopColor='#0B0811' />
          <stop offset='1' stopColor='#07060D' />
        </radialGradient>
        <radialGradient
          id='paint11_radial_1106_7332'
          cx='0'
          cy='0'
          r='1'
          gradientUnits='userSpaceOnUse'
          gradientTransform='translate(232.038 19.9567) scale(5.95744 5.95674)'
        >
          <stop offset='0.15' stopColor='#D67BCE' stopOpacity='0.8' />
          <stop offset='0.26' stopColor='#A861A3' stopOpacity='0.84' />
          <stop offset='0.42' stopColor='#6F416E' stopOpacity='0.9' />
          <stop offset='0.57' stopColor='#422744' stopOpacity='0.94' />
          <stop offset='0.71' stopColor='#221526' stopOpacity='0.97' />
          <stop offset='0.84' stopColor='#0F0A14' stopOpacity='0.99' />
          <stop offset='0.94' stopColor='#08060E' />
          <stop offset='1' stopColor='#07060D' />
        </radialGradient>
        <radialGradient
          id='paint12_radial_1106_7332'
          cx='0'
          cy='0'
          r='1'
          gradientUnits='userSpaceOnUse'
          gradientTransform='translate(41.038 161.957) scale(5.95744 5.95674)'
        >
          <stop offset='0.15' stopColor='#D67BCE' stopOpacity='0.8' />
          <stop offset='0.26' stopColor='#A861A3' stopOpacity='0.84' />
          <stop offset='0.42' stopColor='#6F416E' stopOpacity='0.9' />
          <stop offset='0.57' stopColor='#422744' stopOpacity='0.94' />
          <stop offset='0.71' stopColor='#221526' stopOpacity='0.97' />
          <stop offset='0.84' stopColor='#0F0A14' stopOpacity='0.99' />
          <stop offset='0.94' stopColor='#08060E' />
          <stop offset='1' stopColor='#07060D' />
        </radialGradient>
        <radialGradient
          id='paint13_radial_1106_7332'
          cx='0'
          cy='0'
          r='1'
          gradientUnits='userSpaceOnUse'
          gradientTransform='translate(387.248 21.1657) scale(16.1676 16.1657)'
        >
          <stop offset='0.15' stopColor='#D67BCE' stopOpacity='0.8' />
          <stop offset='0.26' stopColor='#A861A3' stopOpacity='0.84' />
          <stop offset='0.42' stopColor='#6F416E' stopOpacity='0.9' />
          <stop offset='0.57' stopColor='#422744' stopOpacity='0.94' />
          <stop offset='0.71' stopColor='#221526' stopOpacity='0.97' />
          <stop offset='0.84' stopColor='#0F0A14' stopOpacity='0.99' />
          <stop offset='0.94' stopColor='#08060E' />
          <stop offset='1' stopColor='#07060D' />
        </radialGradient>
        <radialGradient
          id='paint14_radial_1106_7332'
          cx='0'
          cy='0'
          r='1'
          gradientUnits='userSpaceOnUse'
          gradientTransform='translate(120.038 74.9567) scale(5.95744 5.95674)'
        >
          <stop offset='0.15' stopColor='#D67BCE' stopOpacity='0.8' />
          <stop offset='0.26' stopColor='#A861A3' stopOpacity='0.84' />
          <stop offset='0.42' stopColor='#6F416E' stopOpacity='0.9' />
          <stop offset='0.57' stopColor='#422744' stopOpacity='0.94' />
          <stop offset='0.71' stopColor='#221526' stopOpacity='0.97' />
          <stop offset='0.84' stopColor='#0F0A14' stopOpacity='0.99' />
          <stop offset='0.94' stopColor='#08060E' />
          <stop offset='1' stopColor='#07060D' />
        </radialGradient>
        <radialGradient
          id='paint15_radial_1106_7332'
          cx='0'
          cy='0'
          r='1'
          gradientUnits='userSpaceOnUse'
          gradientTransform='translate(374.038 197.957) scale(5.95744 5.95674)'
        >
          <stop offset='0.15' stopColor='#D67BCE' stopOpacity='0.8' />
          <stop offset='0.26' stopColor='#A861A3' stopOpacity='0.84' />
          <stop offset='0.42' stopColor='#6F416E' stopOpacity='0.9' />
          <stop offset='0.57' stopColor='#422744' stopOpacity='0.94' />
          <stop offset='0.71' stopColor='#221526' stopOpacity='0.97' />
          <stop offset='0.84' stopColor='#0F0A14' stopOpacity='0.99' />
          <stop offset='0.94' stopColor='#08060E' />
          <stop offset='1' stopColor='#07060D' />
        </radialGradient>
      </defs>
    </svg>
  )
}
