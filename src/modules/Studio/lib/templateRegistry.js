import { METRICS_TYPE } from './utils'
import IncentivesPreview from '../Preview/previews/IncentivesPreview'
import MetricsPreview from '../Preview/previews/MetricsPreview'
import PoolsAprPreview from '../Preview/previews/PoolsAprPreview'
import PortfolioPreview from '../Preview/previews/PortfolioPreview'

const TEMPLATES = {
  'pool-apr': {
    title: 'Pools APR Template',
    subTitle: 'pools apr template subtitle',
    fields: [
      {
        type: 'pair',
        name: 'pairs',
        repeatBy: 'displayCount',
        max: 6,
      },
    ],
    Preview: PoolsAprPreview,
    defaults: { displayCount: 6, pairs: [] },
  },
  incentives: {
    title: 'Voting Incentives Template',
    subTitle: 'Select up to 3 pairs to showcase their voting incentives',
    fields: [
      {
        type: 'pair',
        name: 'pairs',
        repeatBy: 'displayCount',
        max: 3,
      },
    ],
    Preview: IncentivesPreview,
    defaults: { displayCount: 3, pairs: [] },
  },
  portfolio: {
    title: 'Portfolio Growth Template',
    subTitle: 'Select pair and enter your investment amount',
    fields: [
      { type: 'pair', name: 'pair' },
      { type: 'input', name: 'amount', label: 'Investment Amount (USD)', min: 0, typeInput: 'number' },
    ],
    Preview: PortfolioPreview,
    defaults: { pair: null, amount: 1000 },
  },
  metrics: {
    title: 'On-Chain Metrics',
    subTitle: 'on-chain metrics subtitle',
    split: true,
    fields: [
      {
        type: 'radioGroup',
        name: 'metricsType',
        options: [METRICS_TYPE.KEY_METRICS, METRICS_TYPE.RECENT_ACTIVITY],
      },
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
