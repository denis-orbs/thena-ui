export const isProd = process.env.NODE_ENV === 'production'
export const isLocal = process.env.NODE_ENV === 'development'

export const showLogger = isLocal ? true : process.env.NEXT_PUBLIC_SHOW_LOGGER ?? false
export const oneInchApiKey = process.env.NEXT_PUBLIC_1INCH_API_KEY ?? ''
export const alphaThenaTradeTcLink =
  process.env.NEXT_PUBLIC_ALPHA_THENA_TRADE_TC_LINK ?? 'https://arena-alpha.thena.fi/tc'
