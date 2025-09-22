import IncentivesPreview from '../Preview/previews/IncentivesPreview'
import MetricsPreview from '../Preview/previews/MetricsPreview'
import PoolsAprPreview from '../Preview/previews/PoolsAprPreview'
import PortfolioPreview from '../Preview/previews/PortfolioPreview'

const TEMPLATES = {
  'pools-apr': {
    title: 'Pools APR Template',
    subTitle: 'pools apr template subtitle',
    fields: [
      {
        type: 'select',
        name: 'displayCount',
        label: 'Pools to Display',
        options: [
          { value: 1, label: 1 },
          { value: 2, label: 2 },
          { value: 3, label: 3 },
          { value: 4, label: 4 },
          { value: 5, label: 5 },
          { value: 6, label: 6 },
        ],
      },
      {
        type: 'pair',
        name: 'pairs',
        label: 'Pair',
        repeatBy: 'displayCount',
        max: 6,
      },
    ],
    Preview: PoolsAprPreview,
    defaults: { displayCount: 1, pairs: [] },
  },
  incentives: {
    title: 'Voting Incentives Template',
    fields: [
      {
        type: 'select',
        name: 'displayCount',
        label: 'Pools to Display',
        options: [
          { value: 1, label: 1 },
          { value: 2, label: 2 },
          { value: 3, label: 3 },
        ],
      },
      {
        type: 'pair',
        name: 'pairs',
        label: 'Pair',
        repeatBy: 'displayCount',
        max: 3,
      },
    ],
    Preview: IncentivesPreview,
    defaults: { displayCount: 1, pairs: [] },
  },
  portfolio: {
    title: 'Portfolio Growth Template',
    fields: [
      { type: 'pair', name: 'pair', label: 'Pair' },
      { type: 'input', name: 'amount', label: 'Investment Amount (USD)', min: 0, typeInput: 'number' },
    ],
    Preview: PortfolioPreview,
    defaults: { pair: null, amount: 1000 },
  },
  metrics: {
    title: 'On-Chain Metrics',
    subTitle: 'on-chain metrics subtitle',
    fields: [
      { type: 'segmented', name: 'metricsType', label: 'Metrics Type', options: ['Key Metrics', 'Recent Activity'] },
      {
        type: 'checkboxList',
        name: 'metricsShow',
        label: 'Show',
        dependsOn: 'metricsType',
        optionMap: {
          // map options by the value of metricsType
          'Key Metrics': [
            'Total Value Locked',
            'Total Volume',
            'Total Revenue',
            'Total Trading Fees',
            'THENA Market Cap',
            '$THE Price',
          ],
          'Recent Activity': ['Last Epoch Revenue', '24h Volume', '24h Fees'],
        },
      },
    ],
    Preview: MetricsPreview,
    defaults: { metricsType: 'Key Metrics', metricsShow: [] },
  },
}

export function getTemplateBySlug(slug) {
  return TEMPLATES[slug]
}
export default TEMPLATES
