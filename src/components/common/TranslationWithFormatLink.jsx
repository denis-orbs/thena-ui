import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

export function TranslationWithFormatLink({ text, targetText, className, link }) {
  const t = useTranslations()

  const render = useMemo(() => {
    const translatedText = t(text)
    const needReplace = t(targetText)

    const position = translatedText.indexOf(needReplace)

    const part1 = translatedText.substring(0, position)
    const part3 = text.substring(position + needReplace.length)

    return (
      <span className={className}>
        {part1}
        <Link className='text-primary-600 underline' href={link}>
          {needReplace}
        </Link>
        {part3}
      </span>
    )
  }, [t, targetText, text, className, link])

  return render
}
