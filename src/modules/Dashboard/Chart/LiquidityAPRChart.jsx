'use client'

import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Doughnut } from 'react-chartjs-2'

import { NewTextHeading, TextSubHeading } from '@/components/typography'
import { cn, formatAmount } from '@/lib/utils'

ChartJS.register(ArcElement, Tooltip, Legend)

const COLORS = ['#EA66E5', '#E333DD', '#DC00D4', '#B000AA', '#84007F']

const OTHER_COLOR = '#F8CCF6'

const NOT_HOVER_COLOR = '#580055'

function LiquidityAPRChart({ data = [], className }) {
  const t = useTranslations()
  const chartRef = useRef(null)
  const originalColors = useRef([])

  const [hoveredIndex, setHoveredIndex] = useState(null)

  const avgApr = useMemo(() => {
    const totalAprWeighted = data.reduce((acc, d) => acc + (Number(d.apr) || 0), 0)
    const avg = totalAprWeighted ? (totalAprWeighted / data.length).toFixed(2) : '0.00'
    return avg
  }, [data])

  const formatData = (key, dataSource) => {
    const items = dataSource.map(d => {
      const value = key === 'depositLiquidity' ? Number(d.fiatValueOfLiquidity) : Number(d.apr) || 0

      return {
        label: d.symbol,
        value,
        ...(key === 'apr' ? { fiatValueOfLiquidity: Number(d.fiatValueOfLiquidity), symbol: d.symbol } : {}),
      }
    })

    const totalValue = items.reduce((acc, item) => acc + item.value, 0)

    const sorted = [...items].sort((a, b) => b.value - a.value)

    const formatted = []
    let othersValue = 0
    let othersFiatValueOfLiquidity = 0
    if (key === 'apr') {
      sorted.forEach(item => {
        const percent = (item.value / totalValue) * 100

        if (sorted.length > 5 && percent < 5) {
          othersValue += item.value
          othersFiatValueOfLiquidity += item.fiatValueOfLiquidity
        } else {
          formatted.push(item)
        }
      })
    } else {
      othersValue = dataSource.find(item => item.label === 'Others')?.fiatValueOfLiquidity || 0
      formatted.push(...sorted.filter(item => item.label !== 'Others'))
    }

    if (othersValue > 0) {
      formatted.push({
        label: 'Others',
        value: othersValue,
        ...(key === 'apr' ? { fiatValueOfLiquidity: othersFiatValueOfLiquidity, symbol: 'Others' } : {}),
      })
    }

    return formatted
  }

  const aprData = formatData('apr', data)
  const liquidityData = formatData('depositLiquidity', aprData)

  const colorData = aprData.map((d, i) => (d.label === 'Others' ? OTHER_COLOR : COLORS[i % COLORS.length]))

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
        spacing: liquidityData.length === 1 ? 0 : 1,
      },
      {
        label: 'APR',
        data: aprData.map(d => d.value),
        backgroundColor: aprData.map((d, i) => (d.label === 'Others' ? OTHER_COLOR : COLORS[i % COLORS.length])),
        borderWidth: 0,
        spacing: aprData.length === 1 ? 0 : 1,
        radius: '100%',
        cutout: '85%',
      },
    ],
  }

  useEffect(() => {
    originalColors.current = [...colorData]
  }, [colorData, data])

  const options = {
    cutout: '50%',
    plugins: {
      tooltip: {
        enabled: false,
      },
      legend: {
        display: false,
      },
    },
    onHover: (_, elements) => {
      if (!chartRef.current) return

      const chart = chartRef.current
      if (elements.length > 0) {
        const { index } = elements[0]
        setHoveredIndex(index)

        chart.data.datasets.forEach(dataset => {
          const newColors = originalColors.current.map((color, idx) => (idx === hoveredIndex ? color : NOT_HOVER_COLOR))
          dataset.backgroundColor = newColors
        })

        chart.update('none')
      } else if (hoveredIndex !== null) {
        setHoveredIndex(null)

        chart.data.datasets.forEach((dataset, datasetIndex) => {
          dataset.backgroundColor = originalColors.current[datasetIndex]
        })

        chart.update('none')
      }
    },
    events: ['mousemove', 'mouseout'],
  }

  useEffect(() => {
    const isMobile = window.innerWidth <= 834

    if (isMobile && hoveredIndex !== null) {
      const timeout = setTimeout(() => {
        setHoveredIndex(null)
      }, 2000)

      return () => clearTimeout(timeout)
    }
  }, [hoveredIndex])

  const renderCenterContent = useMemo(() => {
    if (hoveredIndex !== null) {
      const pool = aprData[hoveredIndex]
      return (
        <>
          <div className='font-archia text-sm font-semibold text-primary-600 max-md:hidden md:text-xl'>{t('APR')}</div>
          <NewTextHeading className='text-xl font-semibold text-primary-600 md:text-5xl'>
            {formatAmount(pool.value, true)}%
          </NewTextHeading>
          <NewTextHeading className='text-sm text-primary-300 md:text-xl'>
            ${formatAmount(pool.fiatValueOfLiquidity, true)}
          </NewTextHeading>
          <TextSubHeading className='text-xs font-medium text-neutral-300'>{pool.label}</TextSubHeading>
        </>
      )
    }

    return (
      <>
        <div className='text-xl font-semibold text-primary-600 md:text-4xl'>{formatAmount(avgApr, true)}%</div>
        <div className='text-xl font-semibold uppercase text-primary-300 max-md:hidden'>Average APR</div>
      </>
    )
  }, [hoveredIndex, aprData, avgApr, t])

  return (
    <div className={cn('relative h-[200px] w-[200px]', className)}>
      <div className='pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center gap-1 text-center md:gap-2'>
        {renderCenterContent}
      </div>

      <div className='relative z-10'>
        <Doughnut data={chartData} options={options} ref={chartRef} />
      </div>
    </div>
  )
}

export default LiquidityAPRChart
