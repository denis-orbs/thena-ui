import { useTranslations } from 'next-intl'
import { memo, useCallback, useLayoutEffect, useRef, useState } from 'react'

import './style.css'

import cn from '@/utils/classes'

import { TextButton } from '../buttons/Button'

function TruncateContent({ content, className }) {
  const t = useTranslations()
  const [isTruncated, setIsTruncated] = useState(false)
  const [isDisplayBtnTruncate, setDisplayBtnTruncate] = useState(false)
  const contentRef = useRef(null)

  const handleTruncate = useCallback(() => {
    if (content) {
      const target = contentRef.current
      if (!target) return

      let fontSize = 1
      if (target.style.fontSize) fontSize = parseFloat(target.style.fontSize)
      else {
        fontSize = parseFloat(window.getComputedStyle(target, null).getPropertyValue('font-size'))
      }

      if (target.offsetHeight / fontSize > 4) {
        setDisplayBtnTruncate(true)
        setIsTruncated(true)
      } else {
        setDisplayBtnTruncate(false)
        setIsTruncated(false)
      }
    }
  }, [content])

  useLayoutEffect(() => {
    handleTruncate()
  }, [handleTruncate])

  return (
    <div>
      <div
        ref={contentRef}
        className={cn('description break-words whitespace-pre-line', className, isTruncated ? 'show-more' : '')}
      >
        {content}
      </div>
      {isDisplayBtnTruncate && (
        <TextButton
          onClick={() => {
            setIsTruncated(!isTruncated)
          }}
          className='text-xs'
        >
          {isTruncated ? t('More') : t('Less')}
        </TextButton>
      )}
    </div>
  )
}

export default memo(TruncateContent)
