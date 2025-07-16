import dayjs from 'dayjs'
import { sum } from 'lodash'
import { useTranslations } from 'next-intl'
import React, { useCallback } from 'react'
import { Area, AreaChart, Bar, BarChart, ReferenceLine, XAxis, YAxis } from 'recharts'

import { useMediaQuery } from '@/hooks/useMediaQuery'
import { formatAmount } from '@/lib/utils'
import { useLocaleSettings } from '@/state/settings/hooks'

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart'

function CustomPriceLabel({ viewBox, value }) {
  const { x, y, width } = viewBox

  const labelWidth = (value.length + 1) * 7 + 12
  const labelHeight = 20
  const labelX = x + width + 8
  const labelY = y - labelHeight / 2

  return (
    <g>
      <rect x={labelX} y={labelY} width={labelWidth} height={labelHeight} fill='#F299EE' rx={8} ry={8} />
      <text x={labelX + 6} y={labelY + 14} fill='#0D090F' fontSize='12' fontWeight='bold' textAnchor='start'>
        ${value}
      </text>
    </g>
  )
}

function CustomXAxisTick(props) {
  const { isLgDown } = useMediaQuery()
  const { x, y, payload, index } = props
  let displayValue = payload.value
  const dx = index === 0 && displayValue instanceof Date ? (isLgDown ? 20 : 15) : 0
  if (displayValue instanceof Date) {
    displayValue = dayjs(displayValue).format('MMM D')
  }
  return (
    <g transform={`translate(${x + dx},${y})`}>
      <text x={0} y={0} dy={16} textAnchor='middle' fill='#685770' fontSize={14}>
        {displayValue}
      </text>
    </g>
  )
}

function CustomYAxisTick(props) {
  const { x, y, payload } = props
  return (
    <g transform={`translate(${x + 50},${y})`}>
      <text x={0} y={0} dy={4} textAnchor='end' fill='#A1A1AA' fontSize={12}>
        {`$${formatAmount(payload.value, true)}`}
      </text>
    </g>
  )
}

function CustomCursor({ ...rest }) {
  return <rect {...rest} fill='#422d4c' opacity={0.15} rx={4} ry={4} cursor='pointer' />
}

function generateRightAlignedTicks(data, desiredTicks, xAsisKey = 'date') {
  if (!data?.length) return []

  const total = data.length
  const step = Math.ceil(total / desiredTicks)
  const ticks = []

  for (let i = total - 1; i >= 0; i -= step) {
    ticks.unshift(data[i][xAsisKey]) // insert at start
    if (ticks.length >= desiredTicks) break
  }

  return ticks
}

function AnalyticsReChart({
  data,
  xAsisKey,
  chartConfig,
  chartItemConfigs,
  chartType = 'bar',
  useEpoch = false,
  setHoverValue,
  setHoverDate,
  currentPrice,
  showCurrentPrice,
  chartTooltipFormatter,
  desiredTicks = 12,
  xAxisLine = false,
  showTooltip = false,
}) {
  const t = useTranslations()
  const { locale } = useLocaleSettings()
  const onHoverEntry = useCallback(
    entry => {
      const value = sum(chartItemConfigs.map(config => entry[config.dataKey] ?? 0))
      if (useEpoch) {
        if (setHoverValue) setHoverValue(value)
        if (setHoverDate) setHoverDate(`${t('Epoch')} ${entry.epoch ?? 0}`)
      } else {
        const timestamp = entry.time
        if (!timestamp) return
        const now = new Date(timestamp)
        const time = `${now.toLocaleString(locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          // hour: 'numeric',
          // minute: '2-digit',
          // timeZone: 'UTC',
        })}`
        if (setHoverValue) setHoverValue(value)
        if (setHoverDate) setHoverDate(time)
      }
    },
    [chartItemConfigs, locale, setHoverDate, setHoverValue, t, useEpoch],
  )

  const customLabelFormatter = (label, payload) => {
    if (!payload || !payload.length) return null
    const entry = payload[0]?.payload
    if (useEpoch) {
      return `${t('Epoch')} ${entry?.epoch ?? label}`
    }
    const date = entry?.time || label
    return dayjs(date).format('MMM D, YYYY')
  }

  // const xInterval = data && data.length > desiredTicks ? Math.ceil(data.length / desiredTicks) - 1 : 0
  const xTicks = generateRightAlignedTicks(data, desiredTicks, xAsisKey)

  if (chartType === 'area') {
    return (
      <ChartContainer config={chartConfig}>
        <AreaChart
          data={data}
          onMouseMove={state => {
            const { activeIndex } = state
            if (!activeIndex) return
            const entry = data[Number(activeIndex)]
            if (entry) {
              onHoverEntry(entry)
            }
          }}
          onMouseLeave={() => {
            if (setHoverValue) setHoverValue(undefined)
            if (setHoverDate) setHoverDate(undefined)
          }}
        >
          <XAxis
            dataKey={xAsisKey}
            tickLine={false}
            tickMargin={10}
            axisLine={xAxisLine ? { stroke: '#F299EE', strokeWidth: 2 } : false}
            tickFormatter={value => (useEpoch ? value : dayjs(value).format('MMM D'))}
            // interval={xInterval}
            ticks={xTicks}
            tick={<CustomXAxisTick />}
          />
          <YAxis orientation='right' axisLine={false} tickLine={false} tick={<CustomYAxisTick />} />
          <defs>
            <linearGradient id='fillGradient' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#F199EE' stopOpacity={1} />
              <stop offset='95%' stopColor='#F199EE' stopOpacity={0} />
            </linearGradient>
          </defs>
          {chartItemConfigs.map((item, index) => (
            <Area
              key={`${item.dataKey}_${index}`}
              {...item}
              dataKey={item.dataKey}
              type={item.type ?? 'natural'}
              fill={item.fill}
              stroke={item.stroke}
              strokeWidth={item.strokeWidth ?? 2}
              stackId='a'
            />
          ))}
          {showCurrentPrice && (
            <ReferenceLine
              y={Number(currentPrice)}
              stroke='#F299EE'
              strokeDasharray='2 2'
              strokeWidth={2}
              label={<CustomPriceLabel value={`${formatAmount(currentPrice, true)}`} />}
            />
          )}
        </AreaChart>
      </ChartContainer>
    )
  }

  return (
    <ChartContainer config={chartConfig}>
      <BarChart
        accessibilityLayer
        data={data}
        onMouseLeave={() => {
          if (setHoverValue) setHoverValue(undefined)
          if (setHoverDate) setHoverDate(undefined)
        }}
      >
        <XAxis
          dataKey={xAsisKey}
          tickLine={false}
          tickMargin={8}
          axisLine={xAxisLine ? { stroke: '#35243D', strokeWidth: 1 } : false}
          tickFormatter={value => (useEpoch ? value : dayjs(value).format('MMM D'))}
          // interval={xInterval}
          tick={<CustomXAxisTick />}
          ticks={xTicks}
        />
        <YAxis orientation='right' axisLine={false} tickLine={false} tick={<CustomYAxisTick />} />
        <defs>
          <linearGradient id='fillGradient' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor='#F199EE' stopOpacity={1} />
            <stop offset='95%' stopColor='#F199EE' stopOpacity={0.05} />
          </linearGradient>
        </defs>
        {chartItemConfigs.map((item, index) => (
          <Bar
            key={`${item.dataKey}_${index}`}
            dataKey={`${item.dataKey}_${index}`}
            stackId='a'
            fill={item.fill}
            opacity={item.opacity ?? 1}
            onMouseOver={onHoverEntry}
            activeBar={false}
            {...item}
            radius={chartItemConfigs.length - 1 === index ? item.radius : [0, 0, 0, 0]}
            cursor='pointer'
          />
        ))}
        {showTooltip && (
          <ChartTooltip
            className='border-neutral-600 bg-neutral-900'
            content={<ChartTooltipContent />}
            cursor={<CustomCursor />}
            defaultIndex={1}
            formatter={chartTooltipFormatter}
            labelFormatter={customLabelFormatter}
          />
        )}
        {showCurrentPrice && (
          <ReferenceLine
            y={Number(currentPrice)}
            stroke='#F299EE'
            strokeDasharray='2 2'
            strokeWidth={2}
            label={<CustomPriceLabel value={`${formatAmount(currentPrice, true)}`} />}
          />
        )}
      </BarChart>
    </ChartContainer>
  )
}

export default AnalyticsReChart
