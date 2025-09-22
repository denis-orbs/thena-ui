import IncentivesPreview from '../Preview/previews/IncentivesPreview'
import PoolsAprPreview from '../Preview/previews/PoolsAprPreview'

const TEMPLATES = {
  'pools-apr': {
    title: 'Pools APR Template',
    subTitle: 'Select up to 6 pairs to showcase their APR and TVL data',
    fields: [
      { type: 'select', name: 'displayCount', label: 'Pools to Display' },
      {
        type: 'pair',
        name: 'pairs',
        label: 'Pair',
        repeatBy: 'displayCount',
        max: 6,
      },
    ],
    Preview: PoolsAprPreview,
    defaults: { displayCount: '1', pairs: [] },
  },
  incentives: {
    title: 'Voting Incentives Template',
    fields: [
      { type: 'select', name: 'displayCount', label: 'Pools to Display' },
      {
        type: 'pair',
        name: 'pairs',
        label: 'Pair',
        repeatBy: 'displayCount',
        max: 3,
      },
    ],
    Preview: IncentivesPreview,
    defaults: { displayCount: '1', pairs: [] },
  },
  portfolio: {
    title: 'Portfolio Growth Template',
    fields: [
      { type: 'pair', name: 'pair', label: 'Pair' },
      { type: 'number', name: 'amount', label: 'Investment Amount (USD)', min: 0 },
      { type: 'select', name: 'period', label: 'Time Period', options: ['1 Month', '3 Months', '12 Months'] },
    ],
    Preview: null, // PortfolioPreview,
    defaults: { pair: null, amount: 1000, period: '12 Months' },
  },
  metrics: {
    title: 'On-Chain Metrics',
    fields: [
      { type: 'segmented', name: 'metricsType', label: 'Metrics Type', options: ['Key Metrics', 'Recent Activity'] },
      {
        type: 'checkbox-list',
        name: 'show',
        label: 'Show',
        options: [
          'Total Value Locked',
          'Total Volume',
          'Total Revenue',
          'Total Trading Fees',
          'THENA Market Cap',
          '$THE Price',
        ],
      },
    ],
    Preview: null, // MetricsPreview,
    defaults: { metricsType: 'Key Metrics', show: ['Total Value Locked'] },
  },
}

export function getTemplateBySlug(slug) {
  return TEMPLATES[slug]
}
export default TEMPLATES
