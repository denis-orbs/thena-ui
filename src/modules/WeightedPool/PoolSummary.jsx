import React, { useMemo } from 'react'
import { useTranslations } from 'use-intl'

import Box from '@/components/box'
import CircleImage from '@/components/image/CircleImage'
import Table from '@/components/table'
import { Paragraph, TextHeading } from '@/components/typography'
import { formatAmount } from '@/lib/utils'
import { CoinsHandIcon } from '@/svgs'

const sortOptions = [
  {
    label: 'Token',
    value: 'token',
    width: 'lg:w-[40%]',
    isDesc: true,
    disabled: true,
  },
  {
    label: 'USD Value',
    value: 'valueUsd',
    width: 'lg:w-[30%]',
    isDesc: true,
    disabled: true,
  },
  {
    label: 'Pool',
    value: 'weight',
    width: 'lg:w-[30%]',
    isDesc: true,
    disabled: true,
  },
]

function PoolSummary({ tokens, fees }) {
  const t = useTranslations()
  const dataTable = useMemo(
    () =>
      tokens.map(token => ({
        token: (
          <div className='flex items-center gap-3'>
            <CircleImage className='h-8 w-8' src={token.logoURI} alt='thena logo' />
            <TextHeading>{token.symbol}</TextHeading>
          </div>
        ),
        valueUsd: <Paragraph>$ {formatAmount(token.price * (Number(token.amount) || 0))}</Paragraph>,
        weight: <Paragraph>{token.weight} %</Paragraph>,
      })),
    [tokens],
  )

  const summary = useMemo(
    () => ({
      token: <Paragraph>{t('Total')}</Paragraph>,
      valueUsd: (
        <Paragraph>
          $ {formatAmount(tokens.reduce((curr, token) => curr + Number(token.amount || 0) * token.price, 0))}
        </Paragraph>
      ),
      weight: <Paragraph>{tokens.reduce((curr, token) => curr + Number(token.weight), 0)} %</Paragraph>,
    }),
    [t, tokens],
  )

  return (
    <Box>
      <TextHeading>{t('Pool Attributes')}</TextHeading>
      <div className='flex items-center justify-between border-b border-neutral-700 p-4'>
        <div className='flex gap-3'>
          <CoinsHandIcon className='h-5 w-5' />
          <Paragraph>{t('Pool Fees')}</Paragraph>
        </div>
        <Paragraph>{`${fees} %`}</Paragraph>
      </div>
      <Table
        tableBasic
        data={dataTable}
        currentPage={1}
        sortOptions={sortOptions}
        sort={sortOptions[0]}
        notAction
        summary={summary}
      />
    </Box>
  )
}

export default PoolSummary
