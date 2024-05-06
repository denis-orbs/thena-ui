'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React from 'react'

import { EmphasisButton } from '@/components/buttons/Button'

import ThenaContent from '../ThenaContent'

function MintPage() {
  const t = useTranslations()

  return (
    <div className='mt-6'>
      <div className='mt-6'>
        <h2>{t('THENA ID')}</h2>
      </div>
      <div className='mt-6 flex items-center gap-6'>
        <EmphasisButton>
          <Link href='/arena/thena-id/recently-minted'>Recent THENA ID Mints</Link>
        </EmphasisButton>
        {/* <EmphasisButton>
          <Link href='/arena/thena-id/available'>Available THENA IDs</Link>
        </EmphasisButton> */}
      </div>
      <ThenaContent />
    </div>
  )
}

export default MintPage
