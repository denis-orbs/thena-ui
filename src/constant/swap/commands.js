const SWAP_COMMANDS = {
  /*
    Algebra Integral methods:
    IntegralExactInput
    IntegralExactOutput
    */
  INTEGRAL_EXACT_INPUT: '0x00',
  INTEGRAL_EXACT_OUTPUT: '0x01',
  INTEGRAL_EXACT_INPUT_FEE_ON_TRANSFER: '0x02',
  COMMAND_SPLIT_INTEGRAL: '0x07',

  /*
    Algebra Fusion methods:
    FusionExactInput
    FusionExactOutput
    */
  FUSION_EXACT_INPUT: '0x08',
  FUSION_EXACT_OUTPUT: '0x09',
  COMMAND_SPLIT_FUSION: '0x0e',

  /*
    Solidly Methods:
    swapExactTokensForTokens
    swapExactTokensForTokensSupportingFeeOnTransferTokens
    */
  SLD_EXACT_TOKENS_TOKENS: '0x10',
  SLD_EXACT_TOKENS_TOKENS_FEE: '0x11',
  COMMAND_SPLIT_SOLIDLY: '0x17',

  /*
    Operations methods:
    SafeTransferFrom
    Convert wBNB to BNB
    Convert BNB to wBNB
    */
  TRANSFER_TOKEN_FROM_MSGSENDER: '0xa0',
  WRAPPED_TO_NATIVE: '0xa1',
  NATIVE_TO_WRAPPED: '0xa2',
  COMMAND_SPLIT_OPERATIONS: '0xaf',
}

export const SWAP_KIND = {
  INTEGRAL_EXACT_INPUT: 'INTEGRAL_EXACT_INPUT',
  INTEGRAL_EXACT_OUTPUT: 'INTEGRAL_EXACT_OUTPUT',
  FUSION_EXACT_INPUT: 'FUSION_EXACT_INPUT',
  FUSION_EXACT_OUTPUT: 'FUSION_EXACT_OUTPUT',
  SLD_EXACT_TOKENS_TOKENS: 'SLD_EXACT_TOKENS_TOKENS',
  SLD_EXACT_TOKENS_TOKENS_FEE: 'SLD_EXACT_TOKENS_TOKENS_FEE',
}

export default SWAP_COMMANDS
