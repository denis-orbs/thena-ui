'use client'

import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Doughnut } from 'react-chartjs-2'

import { NewTextHeading, TextSubHeading } from '@/components/typography'
import { cn, formatAmount } from '@/lib/utils'
import { calculateManualAPR } from '@/state/fusion/utils'

ChartJS.register(ArcElement, Tooltip, Legend)

const COLORS = ['#EA66E5', '#E333DD', '#DC00D4', '#B000AA', '#84007F']

const OTHER_COLOR = '#F8CCF6'

const NOT_HOVER_COLOR = '#580055'

function LiquidityAPRChart({
  data = [],
  currentHoverTableRow = null,
  isHoverFromChart = false,
  setIsHoverFromChart,
  className,
}) {
  const t = useTranslations()

  const chartRef = useRef(null)
  const originalColors = useRef([])

  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [hoveredDataSetIndex, setHoveredDataSetIndex] = useState(null)
  const avgApr = useMemo(() => {
    // avgApr = (... + myvalue[i] * apr[i] +  myvalue[i+1] * apr[i+1] + .... ) / (... + myvalue[i] + myvalue[i+1] + ...)
    // myvalue is amount to usd user deposit
    const { totalApr, totalValue } = data.reduce(
      (acc, d) => {
        let realApr = Number(d.apr) || 0
        if (d.type === 'Manual') {
          realApr = calculateManualAPR(d) || 0
        }
        const value = Number(d.fiatValueOfLiquidity) || 0
        return {
          totalApr: acc.totalApr + realApr * value,
          totalValue: acc.totalValue + value,
        }
      },
      {
        totalApr: 0,
        totalValue: 0,
      },
    )
    const avg = totalValue !== 0 ? (totalApr / totalValue).toFixed(2) : '0'
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
        label: 'APR',
        data: aprData.map(d => d.value),
        backgroundColor: aprData.map((d, i) =>
          d.label === 'Others' ? OTHER_COLOR : d.label === 'None' ? '#281B2E' : COLORS[i % COLORS.length],
        ),
        borderWidth: 1,
        borderColor: '#1A121E',
        radius: '100%',
        cutout: '82%',
      },
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
        borderWidth: 1,
        borderColor: '#1A121E',
        radius: '100%',
        cutout: '68%',
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
        <div className='pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center text-center md:top-[74px] md:justify-start md:gap-2'>
          <div className='font-archia text-primary-600 text-sm font-semibold max-md:hidden md:text-xl md:leading-6'>
            {t('APR')}
          </div>
          <NewTextHeading className='text-primary-600 text-xl font-semibold md:text-[40px] md:leading-[40px]'>
            {aprValue?.label === 'None' ? '0' : formatAmount(aprValue?.value, true)}%
          </NewTextHeading>
          <div className='flex flex-col'>
            <NewTextHeading className='text-primary-300 text-sm md:text-xl md:leading-6'>
              ${liquidityValue?.label === 'None' ? '0' : formatAmount(liquidityValue?.value, true)}
            </NewTextHeading>
            <TextSubHeading className='text-xs font-medium text-neutral-300'>{poolLabel}</TextSubHeading>
          </div>
        </div>
      )
    }

    return data.length > 0 ? (
      <div className='pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center gap-2 text-center md:top-[106px] md:justify-start'>
        <NewTextHeading className='text-primary-600 text-xl font-semibold md:text-[40px] md:leading-[40px]'>
          {formatAmount(avgApr, true)}%
        </NewTextHeading>
        <div className='text-primary-300 text-xl leading-6! font-semibold uppercase max-md:hidden'>Average APR</div>
      </div>
    ) : (
      <div className='pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center gap-2 text-center'>
        <div className='font-archia text-primary-600 text-sm font-semibold max-md:hidden md:text-xl'>{t('APR')}</div>
        <NewTextHeading className='text-primary-600 text-xl font-semibold md:text-4xl'>0%</NewTextHeading>
        <NewTextHeading className='text-primary-300 text-sm md:text-xl'>$0</NewTextHeading>
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
