import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import React, { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'

import { TextHeading } from '@/components/typography'
import { THENACOLORS } from '@/constant'
import { cn, formatAmount } from '@/lib/utils'

const backgroundCenterPlugin = {
  id: 'backgroundCenter',
  beforeDraw: (chart, _, options) => {
    const { ctx, chartArea } = chart
    const { top, bottom, left, right } = chartArea
    const centerX = (left + right) / 2
    const centerY = (top + bottom) / 2

    const meta = chart.getDatasetMeta(0)
    const firstArc = meta.data[0]
    const { innerRadius } = firstArc

    ctx.save()
    ctx.beginPath()
    ctx.fillStyle = options.color || '#281b2e'
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI)
    ctx.fill()
    ctx.restore()
  },
}

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

function PieChart({ tokens, colors, showTotalPercent = true, className, bgColor = '#281b2e' }) {
  const allZero = tokens.every(item => Number(item.weight) === 0)

  const data = useMemo(
    () =>
      allZero
        ? [
            {
              data: {},
              value: 100,
              color: '#8E8194',
              cutout: '60%',
            },
          ]
        : tokens.map((item, index) => ({
            data: item,
            value: Number(item.weight),
            color: (colors || THENACOLORS)[index],
            cutout: '60%',
          })),
    [colors, tokens, allZero],
  )
  const options = {
    plugins: {
      backgroundCenter: bgColor
        ? {
            color: bgColor,
          }
        : false,
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
        borderColor: bgColor,
        borderWidth: data.length === 1 ? 0 : 3,
        borderRadius: data.length === 1 ? 0 : 4,
        bgColor,
        spacing: data.length === 1 ? 0 : 2,
        hoverOffset: 5,
        dataVisibility: new Array(data.length).fill(true),
      },
    ],
  }

  const totalWeight = useMemo(() => tokens.reduce((sum, curr) => sum + curr.weight, 0), [tokens])
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className='relative h-[230px] w-[230px] overflow-visible'>
        <Doughnut
          height={200}
          width={200}
          data={finalData}
          options={options}
          className='z-20'
          plugins={[backgroundCenterPlugin]}
        />
        {showTotalPercent && (
          <div
            className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform text-lg font-bold text-gray-800'
            style={{ backgroundColor: bgColor }}
          >
            <TextHeading className='font-archia text-3xl font-semibold'>{formatAmount(totalWeight || 0)}%</TextHeading>
          </div>
        )}
      </div>
    </div>
  )
}

export default PieChart
