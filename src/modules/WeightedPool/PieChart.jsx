import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import React, { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'

import { TextHeading } from '@/components/typography'

const colors = ['#32002F', '#84007F', '#B000AA', '#580055', '#DC00D4', '#E333DD', '#EA66E5', '#F199EE']

function calculatePadding(ctx) {
  const { chart } = ctx
  let padding = 0
  chart.data.datasets.forEach(el => {
    const hOffset = el.hoverOffset || 0
    padding = Math.max(hOffset / 2 + 5, padding)
  })
  return padding
}

ChartJS.register(ArcElement, Tooltip, Legend)

function PieChart({ tokensAndWeights }) {
  const data = useMemo(
    () =>
      tokensAndWeights.length > 0
        ? tokensAndWeights.map((item, index) => ({
            data: item.token,
            value: item.weight,
            color: colors[index % colors.length],
            cutout: '50%',
          }))
        : [
            {
              data: {},
              value: 100,
              color: '#8E8194',
              cutout: '50%',
            },
          ],
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
    layout: {
      padding: {
        top(ctx) {
          return calculatePadding(ctx)
        },
        bottom(ctx) {
          return calculatePadding(ctx)
        },
        left(ctx) {
          return calculatePadding(ctx)
        },
        right(ctx) {
          return calculatePadding(ctx)
        },
      },
    },
    // onHover: (event, chartElement) => {
    //   if (chartElement.length) {
    //     const { index } = chartElement[0]
    //     setCenterLogo(data[index]?.data?.logoURI)
    //   } else {
    //     setCenterLogo(null)
    //   }
    // },
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
        borderRadius: data.length === 1 ? 0 : 4,
        spacing: data.length === 1 ? 0 : 2,
        hoverOffset: 15,
        dataVisibility: new Array(data.length).fill(true),
      },
    ],
  }

  const totalWeight = useMemo(() => tokensAndWeights.reduce((sum, curr) => sum + curr.weight, 0), [tokensAndWeights])
  return (
    <div className='flex items-center justify-center'>
      <div className='relative h-[230px] w-[230px] overflow-visible'>
        <Doughnut height={200} width={200} data={finalData} options={options} className='z-20' />
        <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform text-lg font-bold text-gray-800'>
          {totalWeight && <TextHeading className='font-archia text-3xl font-semibold'>{totalWeight}%</TextHeading>}
        </div>
      </div>
    </div>
  )
}

export default PieChart
