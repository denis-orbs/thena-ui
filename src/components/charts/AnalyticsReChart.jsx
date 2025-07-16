import dayjs from 'dayjs'
import { sum } from 'lodash'
import { useTranslations } from 'next-intl'
import React, { useCallback } from 'react'
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis } from 'recharts'

import { useLocaleSettings } from '@/state/settings/hooks'

import { ChartContainer } from '../ui/chart'

function AnalyticsReChart({
  data,
  xAsisKey,
  chartConfig,
  chartItemConfigs,
  chartType = 'bar',
  useEpoch = false,
  setHoverValue,
  setHoverDate,
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
          hour: 'numeric',
          minute: '2-digit',
          timeZone: 'UTC',
        })} (UTC)`
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
          <YAxis orientation='right' axisLine={false} tickLine={false} />
          <defs>
            <linearGradient id='fillGradient' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#F199EE' stopOpacity={1} />
              <stop offset='95%' stopColor='#F199EE' stopOpacity={0.1} />
            </linearGradient>
          </defs>
          {chartItemConfigs.map(item => (
            <Area
              {...item}
              dataKey={item.dataKey}
              type={item.type ?? 'natural'}
              fill={item.fill}
              stroke={item.stroke}
              stackId='a'
            />
          ))}
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
        <YAxis orientation='right' axisLine={false} tickLine={false} />
        <defs>
          <linearGradient id='fillGradient' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor='#F199EE' stopOpacity={1} />
            <stop offset='95%' stopColor='#F199EE' stopOpacity={0.1} />
          </linearGradient>
        </defs>
        {chartItemConfigs.map((item, index) => (
          <Bar
            dataKey={item.dataKey}
            stackId='a'
            fill={item.fill}
            radius={item.radius ?? index === chartItemConfigs.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            onMouseOver={onHoverEntry}
            activeBar={false}
            {...item}
          />
        ))}
      </BarChart>
    </ChartContainer>
  )
}

export default AnalyticsReChart
