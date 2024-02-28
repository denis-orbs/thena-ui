export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        archia: ['Archia', 'sans-serif'],
        aeonik: ['Aeonik', 'sans-serif'],
      },
      colors: {
        primary: {
          100: '#FCE6FB',
          200: '#F8CCF6',
          300: '#F199EE',
          400: '#EA66E5',
          500: '#E333DD',
          600: '#DC00D4',
          700: '#B000AA',
          800: '#84007F',
          900: '#580055',
          950: '#2C002A',
        },
        neutral: {
          50: '#F3F2F4',
          100: '#ECEAED',
          200: '#D9D5DB',
          300: '#B3ABB7',
          400: '#8E8194',
          500: '#685770',
          600: '#422D4C',
          700: '#35243D',
          800: '#281B2E',
          900: '#1A121E',
          950: '#0D090F  ',
        },
        success: {
          100: '#EAFAF0',
          200: '#D4F6E2',
          300: '#AAEDC4',
          400: '#7FE3A7',
          500: '#55DA89',
          600: '#2AD16C',
          700: '#22A756',
          800: '#197D41',
          900: '#11542B',
          950: '#082A16',
        },
        warn: {
          100: '#FEFCE6',
          200: '#FDF9CC',
          300: '#FBF299',
          400: '#F9EC66',
          500: '#F7E533',
          600: '#F5DF00',
          700: '#C4B200',
          800: '#938600',
          900: '#625900',
          950: '#312D00',
        },
        error: {
          100: '#312D00',
          200: '#FDD2CC',
          300: '#FBA499',
          400: '#F97766',
          500: '#F74933',
          600: '#F51C00',
          700: '#C41600',
          800: '#931100',
          900: '#620B00',
          950: '#310600',
        },
        rose: '#FEE8E6',
        focus: '#6666F9',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
