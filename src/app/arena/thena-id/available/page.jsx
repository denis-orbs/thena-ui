'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect } from 'react'

function AvailablePage() {
  const t = useTranslations()
  const router = useRouter()

  useEffect(() => {
    router.push('/arena/thena-id/mint')
  }, [router])

  return (
    <div>
      <div className='mt-6'>
        <h2>{t('Available THENA IDs')}</h2>
      </div>
      <div className='mt-6 w-full'>
        {/* <Table
      data={finalData}
      sortOptions={sortOptions}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      sort={sort}
      setSort={setSort}
    /> */}
      </div>
    </div>
  )
}

export default AvailablePage
