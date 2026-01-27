export const COINGECKO_API_ENDPOINT = 'https://pro-api.coingecko.com/api/v3'

export const ALLOWED_ORIGINS = [/^thena\.fi$/, /^localhost:3000$/, /^thena-frontend-.*\.vercel\.app$/]

export function isAllowedOrigin(origin) {
  if (!origin) return false
  return ALLOWED_ORIGINS.some(regex => regex.test(origin))
}

export function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}
