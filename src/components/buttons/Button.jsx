import React from 'react'

import { CompTypes } from '@/constant/type'
import { cn } from '@/lib/utils'

function Button({
  className,
  iconClassName,
  variant = CompTypes.Primary,
  responsive = false,
  LeadingIcon = null,
  trailingIcon = null,
  isLoading = false,
  children,
  disabled,
  onClick = () => {},
  ...rest
}) {
  return (
    <button
      type='button'
      className={cn(
        'group inline-flex cursor-pointer items-center justify-center gap-2',
        'outline outline-2 outline-offset-4 outline-transparent',
        'rounded-lg font-medium transition-all duration-150 ease-out',
        !disabled && 'active:outline-focus',
        responsive ? 'p-2 text-xs lg:px-4 lg:py-3 lg:text-base lg:leading-tight' : 'px-4 py-3 text-base leading-tight',
        variant === CompTypes.Primary && [
          'bg-primary-600 text-primary-100',
          !disabled && 'hover:bg-primary-700 hover:text-primary-200',
          !disabled && 'active:bg-primary-600 active:text-primary-100',
          disabled && 'bg-neutral-700 text-neutral-500',
        ],
        variant === CompTypes.Secondary && [
          'bg-primary-400 text-primary-900',
          !disabled && 'hover:bg-primary-500 active:bg-primary-400',
          disabled && 'bg-neutral-700 text-neutral-500',
        ],
        variant === CompTypes.Tertiary && [
          'px-[15px] py-[11px]',
          'border border-primary-600 text-primary-600',
          !disabled && 'hover:border-primary-700 hover:text-primary-700',
          !disabled && 'active:border-primary-600 active:text-primary-600',
          disabled && 'border-neutral-700 text-neutral-700',
        ],
        variant === CompTypes.Text && [
          'text-neutral-400',
          !disabled && 'hover:bg-neutral-800 hover:text-neutral-100',
          !disabled && 'active:text-neutral-100',
          disabled && 'bg-transparent text-neutral-600',
        ],
        variant === CompTypes.Emphasis && [
          'bg-neutral-700 text-neutral-100',
          !disabled && 'hover:bg-neutral-600 hover:text-neutral-200',
          !disabled && 'active:bg-neutral-700 active:text-neutral-200',
          disabled && 'text-neutral-500',
        ],
        variant === CompTypes.Outlined && [
          'border border-neutral-600 text-neutral-400',
          !disabled && 'hover:border-transparent hover:bg-neutral-800 hover:text-neutral-100',
          disabled && 'border-neutral-700 bg-transparent text-neutral-700',
        ],
        variant === CompTypes.Trailing && [
          'relative flex items-center overflow-hidden pl-6 pr-4',
          'bg-primary-600 hover:bg-primary-700',
        ],
        disabled && 'cursor-not-allowed',
        isLoading && [],
        className,
      )}
      onClick={() => !disabled && onClick()}
      {...rest}
    >
      {LeadingIcon && (
        <LeadingIcon
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
            iconClassName,
          )}
        />
      )}
      {variant === CompTypes.Trailing ? (
        <>
          <span className='z-10'>{children}</span>
          <svg xmlns='http://www.w3.org/2000/svg' width='16' height='17' viewBox='0 0 16 17' fill='none'>
            <path
              d='M6 12.5L10 8.5L6 4.5'
              stroke='white'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
          <div className='icon-button absolute -bottom-4 left-[19px] h-[46px] w-[100px] rounded-full blur-md' />
        </>
      ) : (
        children
      )}
      {trailingIcon}
    </button>
  )
}

export function PrimaryButton(props) {
  return <Button {...props} />
}

export function SecondaryButton(props) {
  return <Button variant={CompTypes.Secondary} {...props} />
}

export function TertiaryButton(props) {
  return <Button variant={CompTypes.Tertiary} {...props} />
}

export function TextButton(props) {
  return <Button variant={CompTypes.Text} {...props} />
}

export function EmphasisButton(props) {
  return <Button variant={CompTypes.Emphasis} {...props} />
}

export function OutlinedButton(props) {
  return <Button variant={CompTypes.Outlined} {...props} />
}

export function TrailingButton(props) {
  return <Button variant={CompTypes.Trailing} {...props} />
}
