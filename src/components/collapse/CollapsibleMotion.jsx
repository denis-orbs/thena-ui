import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

const defaultEasing = [0.25, 0.46, 0.45, 0.94] // easeOutCubic
export function CollapsibleMotion({
  show,
  children,
  className,
  style,
  duration = 0.25,
  opacityDelay = 0.05,
  easing = defaultEasing,
  marginTop = 0,
  // contentPadding = 'py-2',
  disablePointerEvents = true,
  ...props
}) {
  return (
    <motion.div
      initial={false}
      animate={{
        height: show ? 'auto' : 0,
        opacity: show ? 1 : 0,
        marginTop: show ? marginTop : 0,
      }}
      transition={{
        duration,
        ease: easing,
        opacity: {
          duration: duration * 1.5,
          delay: show ? opacityDelay : 0,
        },
        height: {
          duration,
          ease: easing,
        },
        marginTop: {
          duration,
          ease: easing,
        },
      }}
      className={cn('w-full overflow-hidden', className)}
      style={{
        willChange: 'height, opacity, margin-top',
        // display: show ? 'block' : 'none',
        ...style,
      }}
      {...props}
    >
      <div
        // className={contentPadding}
        style={{
          pointerEvents: disablePointerEvents ? (show ? 'auto' : 'none') : 'auto',
        }}
      >
        {children}
      </div>
    </motion.div>
  )
}

export const CollapsiblePresets = {
  smooth: {
    duration: 0.35,
    easing: [0.25, 0.46, 0.45, 0.94],
    opacityDelay: 0.1,
  },

  snappy: {
    duration: 0.15,
    easing: [0.68, -0.55, 0.265, 1.55], // easeBackOut
    opacityDelay: 0,
  },

  standard: {
    duration: 0.25,
    easing: [0.25, 0.46, 0.45, 0.94],
    opacityDelay: 0.05,
  },

  elegant: {
    duration: 0.4,
    easing: [0.165, 0.84, 0.44, 1], // easeOutQuart
    opacityDelay: 0.15,
  },
}

export function SmoothCollapsible(props) {
  return <CollapsibleMotion {...CollapsiblePresets.smooth} {...props} />
}

export function SnappyCollapsible(props) {
  return <CollapsibleMotion {...CollapsiblePresets.snappy} {...props} />
}

export function ElegantCollapsible(props) {
  return <CollapsibleMotion {...CollapsiblePresets.elegant} {...props} />
}
