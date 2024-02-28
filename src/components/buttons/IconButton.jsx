import React from 'react'

import { CompTypes } from '@/constant/type'
import { cn } from '@/lib/utils'

function IconButton({ className, classNames, variant = CompTypes.Primary, Icon, ...otherProps }) {
  return (
    <button
      type='button'
      className={cn(
        'group inline-flex h-8 w-8 cursor-pointer items-center justify-center',
        'outline outline-2 outline-offset-4 outline-transparent',
        'rounded-lg font-medium transition-all duration-150 ease-out',
        'active:outline-focus disabled:cursor-not-allowed',
        'lg:h-11 lg:w-11',
        variant === CompTypes.Primary && [
          'bg-primary-600',
          'hover:bg-primary-700',
          'active:bg-primary-600',
          'disabled:bg-neutral-700',
        ],
        variant === CompTypes.Secondary && [
          'bg-primary-400',
          'hover:bg-primary-500 active:bg-primary-400',
          'disabled:bg-neutral-700',
        ],
        variant === CompTypes.Tertiary && [
          'border border-primary-600',
          'hover:border-primary-700',
          'active:border-primary-600',
          'disabled:border-neutral-700',
        ],
        variant === CompTypes.Text && ['hover:bg-neutral-800', 'disabled:bg-transparent'],
        variant === CompTypes.Emphasis && ['bg-neutral-700', 'hover:bg-neutral-600', 'active:bg-neutral-700'],
        variant === CompTypes.Outlined && [
          'border border-neutral-600',
          'hover:border-transparent hover:bg-neutral-800',
          'disabled:border-neutral-700 disabled:bg-transparent',
        ],
        className,
      )}
      {...otherProps}
    >
      <Icon
        className={cn(
          'h-4 w-4 transition-all lg:h-5 lg:w-5',
          variant === CompTypes.Primary && [
            'stroke-primary-100',
            'group-hover:stroke-primary-200',
            'group-active:stroke-primary-100',
            'group-disabled:stroke-neutral-500',
          ],
          variant === CompTypes.Secondary && [
            'stroke-primary-900',
            'group-hover:stroke-primary-900',
            'group-active:stroke-primary-900',
            'group-disabled:stroke-neutral-500',
          ],
          variant === CompTypes.Tertiary && [
            'stroke-primary-600',
            'group-hover:stroke-primary-700',
            'group-active:stroke-primary-600',
            'group-disabled:stroke-neutral-700',
          ],
          variant === CompTypes.Text && [
            'stroke-neutral-400',
            'group-hover:stroke-neutral-100',
            'group-active:stroke-neutral-100',
            'group-disabled:stroke-neutral-600',
          ],
          variant === CompTypes.Emphasis && [
            'stroke-neutral-100',
            'group-hover:stroke-neutral-200',
            'group-active:stroke-neutral-200',
            'group-disabled:stroke-neutral-500',
          ],
          variant === CompTypes.Outlined && [
            'stroke-neutral-400',
            'group-hover:stroke-neutral-100',
            'group-active:stroke-neutral-100',
            'group-disabled:stroke-neutral-700',
          ],
          classNames,
        )}
      />
    </button>
  )
}

export function PrimaryIconButton(props) {
  return <IconButton variant={CompTypes.Primary} {...props} />
}
export function SecondaryIconButton(props) {
  return <IconButton variant={CompTypes.Secondary} {...props} />
}
export function TertiaryIconButton(props) {
  return <IconButton variant={CompTypes.Tertiary} {...props} />
}
export function TextIconButton(props) {
  return <IconButton variant={CompTypes.Text} {...props} />
}
export function EmphasisIconButton(props) {
  return <IconButton variant={CompTypes.Emphasis} {...props} />
}
export function OutlineIconButton(props) {
  return <IconButton variant={CompTypes.Outlined} {...props} />
}
