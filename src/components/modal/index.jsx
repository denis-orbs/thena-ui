'use client'

import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'
import ReactModal from 'react-modal'

import { cn, isSmallScreen } from '@/lib/utils'
import { ArrowLeftIcon, XIcon } from '@/svgs'

import { TextIconButton } from '../buttons/IconButton'

export function ModalBody({ children, className }) {
  return <div className={cn('flex flex-col gap-5 p-3 lg:px-6', className)}>{children}</div>
}

export function ModalFooter({ children, className }) {
  return <div className={cn('mt-auto px-3 pt-3 lg:px-6', className)}>{children}</div>
}

function Modal({
  isOpen,
  closeModal,
  children,
  title,
  zIndex,
  width = null,
  isBack = false,
  onClickHandler = null,
  isIntl,
  fontSizeTitle = '',
  showIconX = true,
  style = {},
  ...rest
}) {
  const t = useTranslations()

  const customStyles = useMemo(
    () => ({
      overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(13, 9, 15, 0.8)',
        zIndex: zIndex ?? 60,
      },
      content: isSmallScreen()
        ? {
            inset: '12px',
            border: '0px',
            borderRadius: '12px',
            backgroundColor: '#1A121E',
            padding: '0 0 24px',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90%',
            overflow: 'auto',
          }
        : {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            width: width ? (typeof width === 'string' ? width : `${width}px`) : '540px',
            maxHeight: '90%',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            border: '0px',
            borderRadius: '12px',
            backgroundColor: '#1A121E',
            padding: '0 0 24px',
            overflow: 'auto',
          },
    }),
    [width, zIndex],
  )

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={closeModal}
      style={{ ...customStyles, ...style }}
      closeTimeoutMS={100}
      ariaHideApp={false}
      autoFocus={false}
      {...rest}
    >
      <div className='inline-flex w-full items-center justify-between px-4 pb-3 pt-6 lg:px-6'>
        <div className='flex items-center'>
          {isBack && (
            <TextIconButton Icon={ArrowLeftIcon} className='mr-2' onClick={() => onClickHandler && onClickHandler()} />
          )}
          <div className={`font-archia  font-semibold text-neutral-50 ${fontSizeTitle || 'text-xl lg:text-3xl'}`}>
            {isIntl ? title : title && typeof title === 'string' && t(title)}
          </div>
        </div>
        {showIconX && <TextIconButton Icon={XIcon} onClick={closeModal} />}
      </div>
      {children}
    </ReactModal>
  )
}

export default Modal
