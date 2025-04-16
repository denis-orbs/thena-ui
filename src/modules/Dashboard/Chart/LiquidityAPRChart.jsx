'use client'

import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

import { cn, formatAmount } from '@/lib/utils'

ChartJS.register(ArcElement, Tooltip, Legend)

const COLORS = ['#EA66E5', '#E333DD', '#DC00D4', '#B000AA', '#84007F']

const OTHER_COLOR = '#F8CCF6'

function LiquidityAPRChart({ data = [], className }) {
  const totalAprWeighted = data.reduce((acc, d) => acc + (Number(d.apr) || 0), 0)
  const avgApr = totalAprWeighted ? (totalAprWeighted / data.length).toFixed(2) : '0.00'

  const formatData = key => {
    const items = data.map(d => {
      const value = key === 'depositLiquidity' ? d.depositLiquidity : Number(d.apr) || 0

      return {
        label: d.position.symbol,
        value,
      }
    })

    const totalValue = items.reduce((acc, item) => acc + item.value, 0)

    const sorted = [...items].sort((a, b) => b.value - a.value)

    const formatted = []
    let othersValue = 0

    sorted.forEach(item => {
      const percent = (item.value / totalValue) * 100

      if (sorted.length > 5 && percent < 5) {
        othersValue += item.value
      } else {
        formatted.push(item)
      }
    })

    if (othersValue > 0) {
      formatted.push({ label: 'Others', value: othersValue })
    }

    return formatted
  }

  const liquidityData = formatData('depositLiquidity')
  const aprData = formatData('apr')

  const chartData = {
    datasets: [
      {
        label: 'depositLiquidity',
        data: liquidityData.map(d => d.value),
        backgroundColor: liquidityData.map((_, i) =>
          liquidityData[i].label === 'Others' ? OTHER_COLOR : COLORS[i % COLORS.length],
        ),
        borderWidth: 0,
        radius: '82%',
        cutout: '65%',
      },
      {
        label: 'APR',
        data: aprData.map(d => d.value),
        backgroundColor: aprData.map((d, i) => (d.label === 'Others' ? OTHER_COLOR : COLORS[i % COLORS.length])),
        borderWidth: 0,
        radius: '100%',
        cutout: '85%',
      },
    ],
  }

  const options = {
    cutout: '50%',
    plugins: {
      tooltip: {
        callbacks: {
          label(context) {
            const { dataIndex } = context
            const { datasetIndex } = context
            const val = formatAmount(context.raw, true)
            if (datasetIndex === 0) {
              return `${liquidityData?.[dataIndex].label}: $${val}`
            }
            return `${aprData?.[dataIndex].label}: ${val}%`
          },
        },
      },
      legend: {
        display: false,
      },
    },
  }

  return (
    <div className={cn('relative h-[200px] w-[200px]', className)}>
      <div className='pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center gap-2 text-center'>
        <div className='text-xl font-semibold text-primary-600 md:text-4xl'>{formatAmount(avgApr, true)}%</div>
        <div className='text-xl font-semibold uppercase text-primary-300 max-md:hidden'>Average APR</div>
      </div>

      <div className='relative z-10'>
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  )
}

export default LiquidityAPRChart
