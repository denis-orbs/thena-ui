import dayjs from 'dayjs'
import { sum } from 'lodash'
import { useTranslations } from 'next-intl'
import React, { useCallback } from 'react'
import { Area, AreaChart, Bar, BarChart, ReferenceLine, XAxis, YAxis } from 'recharts'

import { formatAmount } from '@/lib/utils'
import { useLocaleSettings } from '@/state/settings/hooks'

import { ChartContainer } from '../ui/chart'

function CustomPriceLabel({ viewBox, value }) {
  const { x, y, width } = viewBox

  const labelWidth = (value.length + 1) * 7 + 12
  const labelHeight = 20
  const labelX = x + width + 4
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
            axisLine={false}
            tickFormatter={value => (useEpoch ? value : dayjs(value).format('MMM D'))}
          />
          <YAxis
            orientation='right'
            axisLine={false}
            tickLine={false}
            tickFormatter={value => `$${formatAmount(value, true)}`}
          />
          <defs>
            <linearGradient id='fillGradient' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#F199EE' stopOpacity={1} />
              <stop offset='95%' stopColor='#F199EE' stopOpacity={0} />
            </linearGradient>
          </defs>
          {chartItemConfigs.map(item => (
            <Area
              key={item.dataKey}
              {...item}
              dataKey={item.dataKey}
              type={item.type ?? 'natural'}
              fill={item.fill}
              stroke={item.stroke}
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
          axisLine={false}
          tickFormatter={value => (useEpoch ? value : dayjs(value).format('MMM D'))}
        />
        <YAxis
          orientation='right'
          axisLine={false}
          tickLine={false}
          tickFormatter={value => `$${formatAmount(value, true)}`}
        />
        <defs>
          <linearGradient id='fillGradient' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor='#F199EE' stopOpacity={1} />
            <stop offset='95%' stopColor='#F199EE' stopOpacity={0} />
          </linearGradient>
        </defs>
        {chartItemConfigs.map(item => (
          <Bar
            key={item.dataKey}
            dataKey={item.dataKey}
            stackId='a'
            fill={item.fill}
            radius={item.radius ?? [0, 0, 0, 0]}
            onMouseOver={onHoverEntry}
            activeBar={false}
            {...item}
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
      </BarChart>
    </ChartContainer>
  )
}

export default AnalyticsReChart
