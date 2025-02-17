import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { NewTextHeading, NewTextSubHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'

export default function Step2({ setStep }) {
  const t = useTranslations()

  const { replace } = useRouter()
  const searchParams = useSearchParams()
  const pairType = searchParams.get('pairType') || PAIR_TYPES.LSD

  const _updateSearchParams = useCallback(
    updates => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })

      const newPathname = `${window.location.pathname}?${params.toString()}`
      replace(newPathname)
    },
    [replace, searchParams],
  )

  const Title = useMemo(() => {
    switch (pairType) {
      case PAIR_TYPES.STABLE:
        return (
          <h4 className='flex flex-row items-center gap-3'>
            <IconStable />
            <NewTextHeading>{t('Choose Liquidity Type')}</NewTextHeading>
          </h4>
        )

      case PAIR_TYPES.CLASSIC:
        return (
          <h4 className='flex flex-row items-center gap-3'>
            <IconClassic />
            <NewTextHeading>{t('Choose Liquidity Type')}</NewTextHeading>
          </h4>
        )

      case PAIR_TYPES.WEIGHTED:
        return (
          <h4 className='flex flex-row items-center gap-3'>
            <IconWeighted />
            <NewTextHeading>{t('Choose Liquidity Type')}</NewTextHeading>
          </h4>
        )

      case PAIR_TYPES.LSD:
        return (
          <h4 className='flex flex-row items-center gap-3'>
            <IconCL />
            <NewTextHeading>{t('Concentrated Liquidity')}</NewTextHeading>
          </h4>
        )

      default:
        return null
    }
  }, [pairType, t])

  return (
    <div className='space-y-10 lg:space-y-20'>
      {Title}

      <div className='flex flex-col gap-4 lg:flex-row'>
        <div className='flex w-full flex-col gap-3 lg:w-[60%]'>
          <NewTextSubHeading>{t('Liquidity Pool Type')}</NewTextSubHeading>
        </div>
      </div>

      <div className='flex gap-4'>
        <EmphasisButton onClick={() => setStep(1)}>{t('Cancel')}</EmphasisButton>
        <PrimaryButton
          onClick={() => {
            setStep(3)
          }}
        >
          {t('Next')}
        </PrimaryButton>
      </div>
    </div>
  )
}

function IconCL() {
  return (
    <svg width='86' height='86' viewBox='0 0 86 86' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path
        d='M57.33 42.9998C57.33 50.9159 50.9128 57.3332 42.9967 57.3332C35.0806 57.3332 28.6634 50.9159 28.6634 42.9998M57.33 42.9998C57.33 35.0838 50.9128 28.6665 42.9967 28.6665C35.0806 28.6665 28.6634 35.0838 28.6634 42.9998M57.33 42.9998H78.83M28.6634 42.9998H7.16406'
        stroke='#F3F2F4'
        strokeWidth='6.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function IconClassic() {
  return (
    <svg width='86' height='86' viewBox='0 0 86 86' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path
        d='M64.5 53.75L75.25 64.5M75.25 64.5L64.5 75.25M75.25 64.5H66.5385C63.173 64.5 61.4902 64.5 59.9628 64.0361C58.6105 63.6255 57.3525 62.9522 56.2607 62.0549C55.0275 61.0413 54.0941 59.6411 52.2272 56.8408L51.3611 55.5417M64.5 10.75L75.25 21.5M75.25 21.5L64.5 32.25M75.25 21.5H66.5385C63.173 21.5 61.4902 21.5 59.9628 21.9639C58.6105 22.3745 57.3525 23.0478 56.2607 23.9451C55.0275 24.9587 54.0941 26.3589 52.2272 29.1592L33.7728 56.8408C31.9059 59.6411 30.9725 61.0413 29.7392 62.0549C28.6475 62.9522 27.3895 63.6255 26.0372 64.0361C24.5098 64.5 22.827 64.5 19.4615 64.5H10.75M10.75 21.5H19.4615C22.827 21.5 24.5098 21.5 26.0372 21.9639C27.3895 22.3745 28.6475 23.0478 29.7392 23.9451C30.9725 24.9587 31.9059 26.3589 33.7728 29.1592L34.6389 30.4583'
        stroke='#F3F2F4'
        strokeWidth='6.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function IconStable() {
  return (
    <svg width='86' height='86' viewBox='0 0 86 86' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path
        d='M8.95995 46.5827H30.46M55.5433 46.5827H77.0433M43.0016 25.0827V75.2494M43.0016 25.0827C47.9492 25.0827 51.96 21.0719 51.96 16.1243M43.0016 25.0827C38.0541 25.0827 34.0433 21.0719 34.0433 16.1244M14.335 75.2494L71.6683 75.2494M14.335 16.1244L34.0433 16.1244M34.0433 16.1244C34.0433 11.1768 38.0541 7.16602 43.0016 7.16602C47.9492 7.16602 51.96 11.1768 51.96 16.1243M51.96 16.1243L71.6683 16.1243M31.8232 51.3713C30.3874 56.8689 25.5082 60.916 19.71 60.916C13.9117 60.916 9.03253 56.8689 7.59672 51.3713C7.4794 50.9221 7.42074 50.6975 7.41508 49.8C7.41162 49.2499 7.61607 47.9815 7.7922 47.4603C8.07955 46.6101 8.39059 46.1302 9.01267 45.1704L19.71 28.666L30.4072 45.1704C31.0293 46.1302 31.3404 46.6101 31.6277 47.4603C31.8038 47.9815 32.0083 49.2499 32.0048 49.8C31.9992 50.6975 31.9405 50.9221 31.8232 51.3713ZM78.4065 51.3713C76.9707 56.8689 72.0915 60.916 66.2933 60.916C60.4951 60.916 55.6159 56.8689 54.1801 51.3713C54.0627 50.9221 54.0041 50.6975 53.9984 49.8C53.995 49.2499 54.1994 47.9815 54.3755 47.4603C54.6629 46.6101 54.9739 46.1302 55.596 45.1704L66.2933 28.666L76.9906 45.1704C77.6127 46.1302 77.9237 46.6101 78.211 47.4603C78.3872 47.9815 78.5916 49.2499 78.5882 49.8C78.5825 50.6975 78.5238 50.9221 78.4065 51.3713Z'
        stroke='#F3F2F4'
        strokeWidth='6.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
function IconWeighted() {
  return (
    <svg width='86' height='86' viewBox='0 0 86 86' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path
        d='M7.16602 60.9167V60.3785C7.16602 59.2444 7.16602 58.6773 7.25276 58.1249C7.32978 57.6344 7.45756 57.1532 7.63405 56.6891C7.83282 56.1664 8.11417 55.6741 8.67683 54.6894L21.4993 32.25M7.16602 60.9167C7.16602 68.8327 13.5833 75.25 21.4993 75.25C29.4154 75.25 35.8327 68.8327 35.8327 60.9167M7.16602 60.9167V60.2C7.16602 59.1966 7.16602 58.6949 7.3613 58.3116C7.53307 57.9745 7.80716 57.7004 8.14428 57.5286C8.52754 57.3333 9.02925 57.3333 10.0327 57.3333H32.966C33.9694 57.3333 34.4712 57.3333 34.8544 57.5286C35.1915 57.7004 35.4656 57.9745 35.6374 58.3116C35.8327 58.6949 35.8327 59.1966 35.8327 60.2V60.9167M21.4993 32.25L34.3219 54.6894C34.8845 55.6741 35.1659 56.1664 35.3646 56.6891C35.5411 57.1532 35.6689 57.6344 35.7459 58.1249C35.8327 58.6773 35.8327 59.2444 35.8327 60.3785V60.9167M21.4993 32.25L64.4993 25.0833M50.166 53.75V53.2118C50.166 52.0777 50.166 51.5107 50.2528 50.9582C50.3298 50.4677 50.4576 49.9865 50.634 49.5224C50.8328 48.9997 51.1142 48.5074 51.6768 47.5227L64.4993 25.0833M50.166 53.75C50.166 61.6661 56.5833 68.0833 64.4993 68.0833C72.4154 68.0833 78.8327 61.6661 78.8327 53.75M50.166 53.75V53.0333C50.166 52.0299 50.166 51.5282 50.3613 51.1449C50.5331 50.8078 50.8072 50.5337 51.1443 50.3619C51.5275 50.1667 52.0293 50.1667 53.0327 50.1667H75.966C76.9694 50.1667 77.4712 50.1667 77.8544 50.3619C78.1915 50.5337 78.4656 50.8078 78.6374 51.1449C78.8327 51.5282 78.8327 52.0299 78.8327 53.0333V53.75M64.4993 25.0833L77.3219 47.5227C77.8845 48.5074 78.1659 48.9997 78.3646 49.5224C78.5411 49.9865 78.6689 50.4677 78.7459 50.9582C78.8327 51.5107 78.8327 52.0777 78.8327 53.2118V53.75M42.9993 10.75V28.6667'
        stroke='#F3F2F4'
        strokeWidth='6.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
