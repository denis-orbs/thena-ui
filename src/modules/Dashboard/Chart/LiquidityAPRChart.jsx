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

function LiquidityAPRChart({ data = [], currentHoverTableRow = null, className }) {
  const t = useTranslations()

  const chartRef = useRef(null)
  const originalColors = useRef([])

  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [hoveredDataSetIndex, setHoveredDataSetIndex] = useState(null)
  const [isHoverFromChart, setIsHoverFromChart] = useState(false)

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
        positionId: d.positionId,
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
      formatted.push(...items.filter(item => item.label !== 'Others'))
    }

    if (othersValue > 0) {
      formatted.push({
        label: 'Others',
        value: othersValue,
        ...(key === 'apr' ? { fiatValueOfLiquidity: othersFiatValueOfLiquidity, symbol: 'Others' } : {}),
      })
    }
    const isAllValueZero = formatted.every(item => item.value === 0)
    if (!formatted || formatted.length === 0 || data.length === 0 || isAllValueZero) {
      if (key === 'apr') {
        return data.length === 0
          ? [
              {
                label: 'None',
                value: 100,
                fiatValueOfLiquidity: 100,
                symbol: 'None',
              },
            ]
          : data.map(item => ({
              label: 'None',
              symbol: item.symbol,
              value: 100,
              fiatValueOfLiquidity: item.fiatValueOfLiquidity,
            }))
      }
      return [
        {
          label: 'None',
          value: 100,
          fiatValueOfLiquidity: 100,
        },
      ]
    }
    return formatted
  }

  const aprData = formatData('apr', data)
  const liquidityData = formatData('depositLiquidity', aprData)

  const colorData = aprData.map((d, i) =>
    d.label === 'Others' ? OTHER_COLOR : d.label === 'None' ? '#281B2E' : COLORS[i % COLORS.length],
  )

  const chartData = {
    datasets: [
      {
        label: 'depositLiquidity',
        data: liquidityData.map(d => d.value),
        backgroundColor: liquidityData.map((_, i) =>
          liquidityData[i].label === 'Others'
            ? OTHER_COLOR
            : liquidityData[i].label === 'None'
              ? '#281B2E'
              : COLORS[i % COLORS.length],
        ),
        borderWidth: 0,
        radius: '78%',
        cutout: '65%',
        spacing: liquidityData.length === 1 ? 0 : 1,
      },
      {
        label: 'APR',
        data: aprData.map(d => d.value),
        backgroundColor: aprData.map((d, i) =>
          d.label === 'Others' ? OTHER_COLOR : d.label === 'None' ? '#281B2E' : COLORS[i % COLORS.length],
        ),
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
    responsive: true,
    onHover: (event, elements) => {
      if (!chartRef.current) return
      setIsHoverFromChart(true)
      if (elements.length > 0) {
        event.native.target.style.cursor = 'pointer'
      } else {
        event.native.target.style.cursor = 'default'
      }

      const chart = chartRef.current
      if (elements.length > 0) {
        const { index, datasetIndex } = elements[0]
        const pool = datasetIndex === 0 ? liquidityData[index] : aprData[index]
        if (pool.label === 'None') {
          setHoveredIndex(null)
          setHoveredDataSetIndex(null)
          return
        }
        setHoveredIndex(index)
        setHoveredDataSetIndex(datasetIndex)

        chart.data.datasets.forEach(dataset => {
          const newColors = originalColors.current.map((color, idx) => (idx === index ? color : NOT_HOVER_COLOR))
          dataset.backgroundColor = newColors
        })

        chart.update('none')
      } else if (hoveredIndex !== null) {
        setHoveredIndex(null)
        setHoveredDataSetIndex(null)

        chart.data.datasets.forEach((dataset, datasetIndex) => {
          dataset.backgroundColor = originalColors.current[datasetIndex]
        })

        chart.update('none')
      }
    },
    events: ['mousemove', 'mouseout'],
  }

  useEffect(() => {
    if (!chartRef.current || isHoverFromChart) return

    const chart = chartRef.current

    let index = liquidityData.findIndex(item => item.positionId === currentHoverTableRow)
    let datasetIndex = 0

    if (index === -1) {
      index = aprData.findIndex(item => item.positionId === currentHoverTableRow)
      datasetIndex = 1
    }

    if (index === -1) {
      index = aprData.findIndex(item => item.label === 'Others')
    }

    // chart.setActiveElements([{ datasetIndex, index }])
    // chart.update()

    const pool = datasetIndex === 0 ? liquidityData[index] : aprData[index]
    if (currentHoverTableRow === null) {
      setHoveredIndex(null)
      setHoveredDataSetIndex(null)
      return
    }
    if (!pool || pool?.label === 'None') {
      setHoveredIndex(null)
      setHoveredDataSetIndex(null)
    } else {
      setHoveredIndex(index)
      setHoveredDataSetIndex(datasetIndex)
      chart.data.datasets.forEach(dataset => {
        const newColors = originalColors.current.map((color, idx) => (idx === index ? color : NOT_HOVER_COLOR))
        dataset.backgroundColor = newColors
      })
    }
    chart.update('none')
  }, [aprData, currentHoverTableRow, liquidityData, isHoverFromChart])

  const renderCenterContent = useMemo(() => {
    if (hoveredIndex !== null && data.length > 0) {
      const aprValue = aprData[hoveredIndex]
      const liquidityValue = liquidityData[hoveredIndex]
      const poolLabel = hoveredDataSetIndex === 0 ? liquidityValue?.label : aprValue?.label

      return (
        <div className='pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center text-center md:top-[78px] md:justify-start md:gap-2'>
          <div className='font-archia text-sm font-semibold text-primary-600 max-md:hidden md:text-xl'>{t('APR')}</div>
          <NewTextHeading className='text-xl font-semibold text-primary-600 md:text-4xl'>
            {aprValue?.label === 'None' ? '0' : formatAmount(aprValue?.value, true)}%
          </NewTextHeading>
          <NewTextHeading className='text-sm text-primary-300 md:text-xl'>
            ${liquidityValue?.label === 'None' ? '0' : formatAmount(liquidityValue?.value, true)}
          </NewTextHeading>
          <TextSubHeading className='text-xs font-medium text-neutral-300'>{poolLabel}</TextSubHeading>
        </div>
      )
    }

    return data.length > 0 ? (
      <div className='pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center gap-2 text-center md:top-[110px] md:justify-start'>
        <NewTextHeading className='text-xl font-semibold !leading-[48px] text-primary-600 md:text-4xl'>
          {formatAmount(avgApr, true)}%
        </NewTextHeading>
        <div className='text-xl font-semibold uppercase !leading-6 text-primary-300 max-md:hidden'>Average APR</div>
      </div>
    ) : (
      <div className='pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center gap-2 text-center'>
        <div className='font-archia text-sm font-semibold text-primary-600 max-md:hidden md:text-xl'>{t('APR')}</div>
        <NewTextHeading className='text-xl font-semibold text-primary-600 md:text-4xl'>0%</NewTextHeading>
        <NewTextHeading className='text-sm text-primary-300 md:text-xl'>$0</NewTextHeading>
      </div>
    )
  }, [hoveredIndex, aprData, avgApr, t, data.length, hoveredDataSetIndex, liquidityData])

  return (
    <div className={cn('relative h-[200px] w-[200px]', className)}>
      {renderCenterContent}

      <div className='relative z-10'>
        <Doughnut data={chartData} options={options} ref={chartRef} />
      </div>
    </div>
  )
}

export default LiquidityAPRChart
