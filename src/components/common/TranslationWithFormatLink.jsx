import Link from 'next/link'
import React, { useMemo } from 'react'

function HyperLink({ link, text, target }) {
  return (
    <Link target={target} className='text-primary-600 underline' href={link}>
      {text}
    </Link>
  )
}

export function TranslationWithFormatLink({ text, className, hyperLinks }) {
  const outputComponents = useMemo(() => {
    const listTexts = hyperLinks.map(hyperlink => hyperlink.text)
    const regex = new RegExp(listTexts.join('|'), 'g')
    const outputs = []

    let match
    let lastIndex = 0
    // eslint-disable-next-line no-cond-assign
    while ((match = regex.exec(text)) !== null) {
      const { index } = match
      const beginText = text.slice(lastIndex, index)
      if (beginText) {
        outputs.push(beginText)
      }

      lastIndex = regex.lastIndex
      const matchText = text.slice(index, lastIndex)
      const targetLink = hyperLinks?.find(hyperLink => hyperLink.text === matchText)?.link
      const isTargetBlank = hyperLinks?.find(hyperLink => hyperLink.text === matchText)?.target ?? ''

      outputs.push(<HyperLink link={targetLink} text={matchText} target={isTargetBlank} />)
    }

    if (lastIndex < text.length) {
      outputs.push(text.slice(lastIndex, text.length))
    }

    return outputs
  }, [hyperLinks, text])

  return (
    <span className={className}>
      {outputComponents.map((element, index) => (
        <React.Fragment key={index}>{element}</React.Fragment>
      ))}
    </span>
  )
}
