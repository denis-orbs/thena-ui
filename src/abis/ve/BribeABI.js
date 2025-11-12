export const BribeABI = [
  {
    inputs: [],
    name: 'rewardsListLength',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'rewardTokens',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_token',
        type: 'address',
      },
      {
        internalType: 'uint256[]',
        name: '_rewards',
        type: 'uint256[]',
      },
    ],
    name: 'notifyRewardAmountForMultipleEpoch',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]
