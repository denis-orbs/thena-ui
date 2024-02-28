module.exports = {
  ...require('prettier-airbnb-config'),
  semi: false,
  tabWidth: 2,
  printWidth: 120,
  singleQuote: true,
  jsxSingleQuote: true,
  trailingComma: 'all',
  bracketSpacing: true,
  plugins: ['prettier-plugin-tailwindcss'],
}
