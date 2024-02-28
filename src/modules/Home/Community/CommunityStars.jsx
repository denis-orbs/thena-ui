import { motion } from 'framer-motion'

export function CommunityStars({ className }) {
  return (
    <svg
      className={className}
      width='1060'
      height='279'
      viewBox='0 0 1060 279'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      {/* Shooting stars */}
      <motion.path
        initial={{ opacity: 0, transform: 'translate(0px, -0px)' }}
        className='!origin-center [transform-box:fill-box]'
        animate={{
          transform: 'translate(-60px, 60px)',
          opacity: [0, 0.65, 0],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          delay: 0.5,
          repeatDelay: 0.5,
          ease: 'linear',
        }}
        d='M655.213 99.2878L729.459 25.0416'
        stroke='url(#paint0_linear_1163_17569)'
      />
      <motion.path
        initial={{ opacity: 0, transform: 'translate(0px, -0px)' }}
        className='!origin-center [transform-box:fill-box]'
        animate={{
          transform: 'translate(-60px, 60px)',
          opacity: [0, 0.65, 0],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          delay: 1.2,
          repeatDelay: 0.5,
          ease: 'linear',
        }}
        d='M384.912 74.3919L427.759 31.5451'
        stroke='url(#paint2_linear_1163_17569)'
        strokeWidth='0.577091'
      />
      <motion.path
        initial={{ opacity: 0, transform: 'translate(0px, -0px)' }}
        className='!origin-center [transform-box:fill-box]'
        animate={{
          transform: 'translate(-60px, 60px)',
          opacity: [0, 0.65, 0],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          delay: 1,
          repeatDelay: 0.5,
          ease: 'linear',
        }}
        d='M267.459 222.27L295.207 194.522'
        stroke='url(#paint1_linear_1163_17569)'
        strokeWidth='0.373729'
      />

      <motion.path
        initial={{ opacity: 0, transform: 'translate(60px, -60px)' }}
        className='!origin-center [transform-box:fill-box]'
        animate={{
          transform: 'translate(0px, 0px)',
          opacity: [0, 0.25, 0],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          delay: 2,
          repeatDelay: 0.5,
          ease: 'linear',
        }}
        opacity='0.25'
        d='M291.496 278L324.777 245.55'
        stroke='url(#paint3_linear_1163_17569)'
        strokeWidth='1.39828'
        strokeLinecap='round'
      />

      {/* Stars */}
      <motion.ellipse
        cx='1.20291'
        cy='1.17288'
        rx='1.20291'
        ry='1.17288'
        transform='matrix(-1 0 0 1 293.652 200.978)'
        fill='white'
        initial={{ fillOpacity: 0 }}
        animate={{ fillOpacity: [0, 0.25, 0] }}
        transition={{ repeat: Infinity, duration: 1.7, repeatDelay: Math.random() * 1.3, ease: 'linear' }}
      />
      <motion.ellipse
        cx='1.20291'
        cy='1.17288'
        rx='1.20291'
        ry='1.17288'
        transform='matrix(-1 0 0 1 364.508 219.82)'
        fill='white'
        initial={{ fillOpacity: 0 }}
        animate={{ fillOpacity: [0, 0.25, 0] }}
        transition={{
          repeat: Infinity,
          duration: 1.7,
          // radom delay
          delay: Math.random() * 0.5,
          repeatDelay: Math.random() * 1.3,
          ease: 'linear',
        }}
      />
      <motion.ellipse
        cx='1.20291'
        cy='1.17288'
        rx='1.20291'
        ry='1.17288'
        transform='matrix(-1 0 0 1 148.721 271.112)'
        fill='white'
        fillOpacity='0.25'
        initial={{ fillOpacity: 0 }}
        animate={{ fillOpacity: [0, 1, 0] }}
        transition={{
          repeat: Infinity,
          duration: 1.7,
          // radom delay
          delay: Math.random() * 2,
          repeatDelay: Math.random() * 1.3,
          ease: 'linear',
        }}
      />
      <motion.ellipse
        cx='1.20291'
        cy='1.17288'
        rx='1.20291'
        ry='1.17288'
        transform='matrix(-1 0 0 1 101.98 204.081)'
        fill='white'
        fillOpacity='0.25'
        initial={{ fillOpacity: 0 }}
        animate={{ fillOpacity: [0, 0.25, 0] }}
        transition={{
          repeat: Infinity,
          duration: 1.7,
          // radom delay
          delay: Math.random() * 1.5,
          repeatDelay: Math.random() * 1.3,
          ease: 'linear',
        }}
      />
      <motion.ellipse
        cx='1.20291'
        cy='1.17288'
        rx='1.20291'
        ry='1.17288'
        transform='matrix(-1 0 0 1 120.619 105.229)'
        fill='white'
        fillOpacity='0.25'
        initial={{ fillOpacity: 0 }}
        animate={{ fillOpacity: [0, 1, 0] }}
        transition={{
          repeat: Infinity,
          duration: 1.7,
          // radom delay
          delay: Math.random() * 1.5,
          repeatDelay: Math.random() * 1.3,
          ease: 'linear',
        }}
      />
      <motion.ellipse
        cx='1.20291'
        cy='1.17288'
        rx='1.20291'
        ry='1.17288'
        transform='matrix(-1 0 0 1 256.621 30.4949)'
        fill='white'
        fillOpacity='0.25'
        initial={{ fillOpacity: 0 }}
        animate={{ fillOpacity: [0, 0.25, 0] }}
        transition={{
          repeat: Infinity,
          duration: 1.7,
          // radom delay
          delay: Math.random() * 1.5,
          repeatDelay: Math.random() * 1.3,
          ease: 'linear',
        }}
      />
      <motion.ellipse
        cx='1.20291'
        cy='1.17288'
        rx='1.20291'
        ry='1.17288'
        transform='matrix(-1 0 0 1 93.0254 0)'
        fill='white'
        fillOpacity='0.25'
        initial={{ fillOpacity: 0 }}
        animate={{ fillOpacity: [0, 0.25, 0] }}
        transition={{
          repeat: Infinity,
          duration: 1.7,
          // radom delay
          delay: Math.random() * 2,
          repeatDelay: Math.random() * 1.3,
          ease: 'linear',
        }}
      />
      <motion.ellipse
        cx='1.20291'
        cy='1.17288'
        rx='1.20291'
        ry='1.17288'
        transform='matrix(-1 0 0 1 472.344 28.1491)'
        fill='white'
        fillOpacity='0.25'
        initial={{ fillOpacity: 0 }}
        animate={{ fillOpacity: [0, 0.25, 0] }}
        transition={{
          repeat: Infinity,
          duration: 1.7,
          // radom delay
          delay: Math.random() * 1.3,
          repeatDelay: Math.random() * 1.3,
          ease: 'linear',
        }}
      />
      <motion.ellipse
        cx='1.20291'
        cy='1.17288'
        rx='1.20291'
        ry='1.17288'
        transform='matrix(-1 0 0 1 341.963 133.986)'
        fill='white'
        initial={{ fillOpacity: 0 }}
        animate={{ fillOpacity: [0, 1, 0] }}
        transition={{
          repeat: Infinity,
          duration: 1.7,
          // radom delay
          delay: Math.random() * 1.3,
          repeatDelay: Math.random() * 1.3,
          ease: 'linear',
        }}
      />
      <motion.ellipse
        cx='1.20291'
        cy='1.17288'
        rx='1.20291'
        ry='1.17288'
        transform='matrix(-1 0 0 1 136.33 179.06)'
        fill='white'
        fillOpacity='0.45'
        initial={{ fillOpacity: 0 }}
        animate={{ fillOpacity: [0, 0.25, 0] }}
        transition={{
          repeat: Infinity,
          duration: 1.7,
          // radom delay
          delay: Math.random() * 1.2,
          repeatDelay: Math.random() * 1.3,
          ease: 'linear',
        }}
      />
      <motion.ellipse
        cx='1.20291'
        cy='1.17288'
        rx='1.20291'
        ry='1.17288'
        transform='matrix(-1 0 0 1 2.40625 64.1173)'
        fill='white'
        initial={{ fillOpacity: 0 }}
        animate={{ fillOpacity: [0, 0.25, 0] }}
        transition={{
          repeat: Infinity,
          duration: 1.7,
          // radom delay
          delay: Math.random() * 1.2,
          repeatDelay: Math.random() * 1.3,
          ease: 'linear',
        }}
      />
      <motion.ellipse
        cx='1.20291'
        cy='1.17288'
        rx='1.20291'
        ry='1.17288'
        transform='matrix(-1 0 0 1 951.854 219.82)'
        fill='white'
        initial={{ fillOpacity: 0 }}
        animate={{ fillOpacity: [0, 0.25, 0] }}
        transition={{
          repeat: Infinity,
          duration: 1.7,
          // radom delay
          delay: Math.random() * 1.2,
          repeatDelay: Math.random() * 1.3,
          ease: 'linear',
        }}
      />
      <motion.ellipse
        cx='1.20291'
        cy='1.17288'
        rx='1.20291'
        ry='1.17288'
        transform='matrix(-1 0 0 1 736.066 271.112)'
        fill='white'
        fillOpacity='0.25'
        initial={{ fillOpacity: 0 }}
        animate={{ fillOpacity: [0, 0.25, 0] }}
        transition={{
          repeat: Infinity,
          duration: 1.7,
          // radom delay
          delay: Math.random() * 1.2,
          repeatDelay: Math.random() * 1.3,
          ease: 'linear',
        }}
      />
      <motion.ellipse
        cx='1.20291'
        cy='1.17288'
        rx='1.20291'
        ry='1.17288'
        transform='matrix(-1 0 0 1 689.324 204.081)'
        fill='white'
        fillOpacity='0.25'
        initial={{ fillOpacity: 0 }}
        animate={{ fillOpacity: [0, 1, 0] }}
        transition={{
          repeat: Infinity,
          duration: 1.7,
          // radom delay
          delay: Math.random() * 1.1,
          repeatDelay: Math.random() * 1.3,
          ease: 'linear',
        }}
      />
      <motion.ellipse
        cx='1.20291'
        cy='1.17288'
        rx='1.20291'
        ry='1.17288'
        transform='matrix(-1 0 0 1 707.963 105.229)'
        fill='white'
        fillOpacity='0.25'
        initial={{ fillOpacity: 0 }}
        animate={{ fillOpacity: [0, 0.25, 0] }}
        transition={{
          repeat: Infinity,
          duration: 1.7,
          // radom delay
          delay: Math.random() * 1.8,
          repeatDelay: Math.random() * 1.3,
          ease: 'linear',
        }}
      />
      <motion.ellipse
        cx='1.20291'
        cy='1.17288'
        rx='1.20291'
        ry='1.17288'
        transform='matrix(-1 0 0 1 843.965 30.4949)'
        fill='white'
        fillOpacity='0.25'
        initial={{ fillOpacity: 0 }}
        animate={{ fillOpacity: [0, 0.25, 0] }}
        transition={{
          repeat: Infinity,
          duration: 1.7,
          // radom delay
          delay: Math.random() * 1.4,
          repeatDelay: Math.random() * 1.3,
          ease: 'linear',
        }}
      />
      <motion.ellipse
        cx='1.20291'
        cy='1.17288'
        rx='1.20291'
        ry='1.17288'
        transform='matrix(-1 0 0 1 680.369 0)'
        fill='white'
        fillOpacity='0.25'
        initial={{ fillOpacity: 0 }}
        animate={{ fillOpacity: [0, 1, 0] }}
        transition={{
          repeat: Infinity,
          duration: 1.7,
          // radom delay
          delay: Math.random(),
          repeatDelay: Math.random() * 1.3,
          ease: 'linear',
        }}
      />
      <motion.ellipse
        cx='1.20291'
        cy='1.17288'
        rx='1.20291'
        ry='1.17288'
        transform='matrix(-1 0 0 1 1059.69 28.1491)'
        fill='white'
        fillOpacity='0.25'
        initial={{ fillOpacity: 0 }}
        animate={{ fillOpacity: [0, 1, 0] }}
        transition={{
          repeat: Infinity,
          duration: 1.7,
          // radom delay
          delay: Math.random(),
          repeatDelay: Math.random() * 1.3,
          ease: 'linear',
        }}
      />
      <motion.ellipse
        cx='1.20291'
        cy='1.17288'
        rx='1.20291'
        ry='1.17288'
        transform='matrix(-1 0 0 1 929.309 133.986)'
        fill='white'
        initial={{ fillOpacity: 0 }}
        animate={{ fillOpacity: [0, 0.25, 0] }}
        transition={{
          repeat: Infinity,
          duration: 1.7,
          // radom delay
          delay: Math.random(),
          repeatDelay: Math.random() * 1.3,
          ease: 'linear',
        }}
      />
      <motion.ellipse
        cx='1.20291'
        cy='1.17288'
        rx='1.20291'
        ry='1.17288'
        transform='matrix(-1 0 0 1 723.674 179.06)'
        fill='white'
        fillOpacity='0.45'
        initial={{ fillOpacity: 0 }}
        animate={{ fillOpacity: [0, 0.25, 0] }}
        transition={{
          repeat: Infinity,
          duration: 1.7,
          // radom delay
          delay: Math.random(),
          repeatDelay: Math.random() * 1.3,
          ease: 'linear',
        }}
      />
      <motion.ellipse
        cx='1.20291'
        cy='1.17288'
        rx='1.20291'
        ry='1.17288'
        transform='matrix(-1 0 0 1 589.75 64.1173)'
        fill='white'
        initial={{ fillOpacity: 0 }}
        animate={{ fillOpacity: [0, 0.25, 0] }}
        transition={{
          repeat: Infinity,
          duration: 1.7,
          // radom delay
          delay: Math.random(),
          repeatDelay: Math.random() * 1.3,
          ease: 'linear',
        }}
      />
      <defs>
        <linearGradient
          id='paint0_linear_1163_17569'
          x1='654.859'
          y1='98.9343'
          x2='729.106'
          y2='24.6881'
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#960891' />
          <stop offset='1' stopColor='#960891' stopOpacity='0' />
        </linearGradient>
        <linearGradient
          id='paint1_linear_1163_17569'
          x1='267.105'
          y1='221.916'
          x2='294.853'
          y2='194.169'
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#960891' />
          <stop offset='1' stopColor='#960891' stopOpacity='0' />
        </linearGradient>
        <linearGradient
          id='paint2_linear_1163_17569'
          x1='384.559'
          y1='74.0384'
          x2='427.405'
          y2='31.1915'
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#960891' />
          <stop offset='1' stopColor='#960891' stopOpacity='0' />
        </linearGradient>
        <linearGradient
          id='paint3_linear_1163_17569'
          x1='291.138'
          y1='277.651'
          x2='323.577'
          y2='244.381'
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#DC00D4' stopOpacity='0.65' />
          <stop offset='1' stopColor='#DC00D4' stopOpacity='0' />
        </linearGradient>
      </defs>
    </svg>
  )
}
