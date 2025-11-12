export const VeTHEAPIABI = [
  {
    inputs: [
      { internalType: 'address', name: 'user', type: 'address' },
      { internalType: 'address', name: '_pair', type: 'address' },
    ],
    name: 'singlePairRewardAddress',
    outputs: [
      {
        components: [
          { internalType: 'uint8', name: 'decimals', type: 'uint8' },
          { internalType: 'uint256', name: 'amount', type: 'uint256' },
          { internalType: 'address', name: 'token', type: 'address' },
        ],
        internalType: 'struct veNFTAPI.Reward[]',
        name: '_reward',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]
