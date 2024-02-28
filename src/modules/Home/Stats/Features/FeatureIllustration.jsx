import { IntroductionIllustration } from './IntroductionIllustration'
import { StakeAndEarn } from './StakeAndEarn'
import { ThenaCore } from './ThenaCore'

export function FeatureIllustration({ feature, className }) {
  const featureIllustrations = {
    introduction: <IntroductionIllustration />,
    stake_and_earn: <StakeAndEarn />,
    thena_core: <ThenaCore />,
  }

  const featureIllustration = featureIllustrations[feature]

  return <div className={className}>{featureIllustration}</div>
}
