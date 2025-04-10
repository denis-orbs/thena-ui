'use client'

import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

import { cn, formatAmount } from '@/lib/utils'

ChartJS.register(ArcElement, Tooltip, Legend)

const COLORS = ['#EA66E5', '#E333DD', '#DC00D4', '#B000AA', '#84007F']

const DARK_COLOR = '#F8CCF6'

function LiquidityAPRChart({ data = [], className }) {
  const totalLiquidity = data.reduce((acc, d) => acc + d.depositLiquidity, 0)
  const totalAprWeighted = data.reduce((acc, d) => acc + (Number(d.apr) || 0), 0)
  const avgApr = totalLiquidity ? (totalAprWeighted / data.length).toFixed(2) : '0.00'

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
    labels: liquidityData.map(d => d.label),
    datasets: [
      {
        label: 'depositLiquidity',
        data: liquidityData.map(d => d.value),
        backgroundColor: liquidityData.map((_, i) =>
          liquidityData[i].label === 'Others' ? DARK_COLOR : COLORS[i % COLORS.length],
        ),
        borderWidth: 0,
        radius: '85%',
        cutout: '65%',
      },
      {
        label: 'APR',
        data: aprData.map(d => d.value),
        backgroundColor: aprData.map((d, i) => (d.label === 'Others' ? DARK_COLOR : COLORS[i % COLORS.length])),
        borderWidth: 0,
        radius: '100%',
        cutout: '90%',
      },
    ],
  }

  const options = {
    cutout: '50%',
    plugins: {
      tooltip: {
        callbacks: {
          label(context) {
            const label = context.label || ''
            const val = context.raw.toLocaleString(undefined, { maximumFractionDigits: 2 })
            return `${label}: ${val}`
          },
        },
      },
      legend: {
        display: false,
      },
    },
    // onHover: (_, chartElements) => {
    //   if (chartElements.length > 0) {
    //     const { index } = chartElements[0]
    //     const label = chartData.labels[index]
    //     setHoveredLabel(label)
    //   } else {
    //     setHoveredLabel(null)
    //   }
    // },
  }

  return (
    <div className={cn('relative h-[200px] w-[200px]', className)}>
      <div className='pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center gap-2 text-center'>
        <div className='text-xl font-semibold text-primary-600 md:text-5xl'>{formatAmount(avgApr, true)}%</div>
        <div className='text-xl uppercase text-primary-300 max-md:hidden'>Average APR</div>
      </div>

      <div className='relative z-10'>
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  )
}

export default LiquidityAPRChart
