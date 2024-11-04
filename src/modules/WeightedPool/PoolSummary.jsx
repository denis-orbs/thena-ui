'use client'

import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import { Doughnut } from 'react-chartjs-2'

import Box from '@/components/box'
import { TextHeading } from '@/components/typography'
import { cn } from '@/lib/utils'

const colors = ['#EA66E5', '#32002F', '#84007F', '#DC00D4']

ChartJS.register(ArcElement, Tooltip, Legend)
export default function PoolSummary({ tokensAndWeights }) {
  const [centerLogo, setCenterLogo] = useState(null)

  const data = useMemo(
    () =>
      tokensAndWeights.map((item, index) => ({
        data: item.token,
        value: item.allocate,
        color: colors[index % colors.length],
        cutout: '50%',
      })),
    [tokensAndWeights],
  )

  const options = {
    plugins: {
      responsive: true,
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
      centerLabel: {
        display: true,
      },
    },
    onHover: (event, chartElement) => {
      if (chartElement.length) {
        const { index } = chartElement[0]
        setCenterLogo(data[index]?.data?.logoURI)
      } else {
        setCenterLogo(null)
      }
    },
    cutout: data.map(item => item.cutout),
  }

  const finalData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        data: data.map(item => Math.round(item.value)),
        backgroundColor: data.map(item => item.color),
        borderColor: data.map(item => item.color),
        borderWidth: 1,
        borderRadius: 4,
        spacing: 2,
        hoverOffset: 5,
        dataVisibility: new Array(data.length).fill(true),
      },
    ],
  }

  const t = useTranslations()
  return (
    <Box className='flex flex-col space-y-6'>
      <TextHeading className='font-archia text-2xl font-semibold'>{t('Pool Summary')}</TextHeading>
      <div className='flex items-center justify-center'>
        <div className='relative h-[230px] w-[230px]'>
          <Doughnut height={200} width={200} data={finalData} options={options} />
          <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform text-lg font-bold text-gray-800'>
            {centerLogo && <Image src={centerLogo} width={100} height={100} alt='logo' />}
          </div>
        </div>
      </div>
      <div className='hidden bg-[#EA66E5]' />
      <div className='hidden bg-[#32002F]' />
      <div className='hidden bg-[#84007F]' />
      <div className='hidden bg-[#DC00D4]' />
      <div className='grid grid-cols-4 justify-between'>
        {data.map(item => (
          <div className='flex flex-row items-center gap-[6px]'>
            <div className={cn('h-3 w-3 rounded-full', `bg-[${item?.color}]`)} />
            <TextHeading>{item?.data?.symbol}</TextHeading>
          </div>
        ))}
      </div>
    </Box>
  )
}
