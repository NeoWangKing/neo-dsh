/**
 * dsh-nord-theme — Nord (https://www.nordtheme.com) as a DSH theme.
 *
 * The harness's theme service takes `{ id, colorScheme, tokens }`, and every semantic
 * `--dsw-alias-*` token references the `--dsw-static-*` layer — so remapping the static palette
 * themes the whole UI without patching harness code.
 *
 * Tokens are generated from the palette present in the build and ordered by lightness:
 * shade 50 → Snow Storm (text), shade 950/1000 → Polar Night (surfaces). Getting that
 * direction wrong once turned the entire UI white.
 */
const NORD_TOKENS = {
  '--dsw-static-neutral-00': '#ECEFF4',
  '--dsw-static-neutral-bluish-00': '#ECEFF4',
  '--dsw-static-neutral-50': '#ECEFF4',
  '--dsw-static-neutral-bluish-50': '#ECEFF4',
  '--dsw-static-neutral-bluish-60': '#ECEFF4',
  '--dsw-static-neutral-bluish-75': '#ECEFF4',
  '--dsw-static-neutral-100': '#ECEFF4',
  '--dsw-static-neutral-bluish-100': '#ECEFF4',
  '--dsw-static-neutral-150': '#E5E9F0',
  '--dsw-static-neutral-bluish-150': '#E5E9F0',
  '--dsw-static-neutral-200': '#E5E9F0',
  '--dsw-static-neutral-bluish-200': '#E5E9F0',
  '--dsw-static-neutral-250': '#D8DEE9',
  '--dsw-static-neutral-300': '#D8DEE9',
  '--dsw-static-neutral-bluish-300': '#D8DEE9',
  '--dsw-static-neutral-400': '#8A94A6',
  '--dsw-static-neutral-bluish-400': '#8A94A6',
  '--dsw-static-neutral-500': '#6E7A8F',
  '--dsw-static-neutral-bluish-500': '#6E7A8F',
  '--dsw-static-neutral-550': '#5E6779',
  '--dsw-static-neutral-600': '#5E6779',
  '--dsw-static-neutral-bluish-600': '#5E6779',
  '--dsw-static-neutral-700': '#4C566A',
  '--dsw-static-neutral-bluish-700': '#4C566A',
  '--dsw-static-neutral-bluish-750': '#434C5E',
  '--dsw-static-neutral-800': '#434C5E',
  '--dsw-static-neutral-bluish-800': '#434C5E',
  '--dsw-static-neutral-850': '#3B4252',
  '--dsw-static-neutral-bluish-850': '#3B4252',
  '--dsw-static-neutral-bluish-875': '#3B4252',
  '--dsw-static-neutral-900': '#3B4252',
  '--dsw-static-neutral-bluish-900': '#3B4252',
  '--dsw-static-neutral-bluish-950': '#2E3440',
  '--dsw-static-neutral-1000': '#2E3440',
  '--dsw-static-neutral-bluish-1000': '#2E3440',
  '--dsw-static-blue-950': '#4C566A',
  '--dsw-static-blue-900': '#4C566A',
  '--dsw-static-blue-800': '#4C566A',
  '--dsw-static-blue-600': '#5E81AC',
  '--dsw-static-blue-500': '#81A1C1',
  '--dsw-static-blue-50p': '#81A1C1',
  '--dsw-static-blue-450': '#81A1C1',
  '--dsw-static-blue-400': '#81A1C1',
  '--dsw-static-blue-300': '#88C0D0',
  '--dsw-static-blue-100': '#8FBCBB',
  '--dsw-static-blue-75': '#8FBCBB',
  '--dsw-static-blue-50': '#8FBCBB',
  '--dsw-static-deepseek-900': '#4C566A',
  '--dsw-static-deepseek-800': '#4C566A',
  '--dsw-static-deepseek-600': '#5E81AC',
  '--dsw-static-deepseek-500': '#5E81AC',
  '--dsw-static-deepseek-700-delete': '#5E81AC',
  '--dsw-static-deepseek-450': '#81A1C1',
  '--dsw-static-deepseek-400': '#81A1C1',
  '--dsw-static-deepseek-300': '#81A1C1',
  '--dsw-static-deepseek-200': '#81A1C1',
  '--dsw-static-deepseek-100': '#88C0D0',
  '--dsw-static-deepseek-50': '#88C0D0',
  '--dsw-static-red-900': '#8C4A52',
  '--dsw-static-red-600': '#A0525B',
  '--dsw-static-red-600-a08': 'rgb(160 82 91 / 8%)',
  '--dsw-static-red-500': '#A0525B',
  '--dsw-static-red-400': '#BF616A',
  '--dsw-static-red-400-a12': 'rgb(191 97 106 / 12%)',
  '--dsw-static-red-100': '#D08770',
  '--dsw-static-red-50': '#D08770',
  '--dsw-static-green-900': '#6B8557',
  '--dsw-static-green-500': '#87A06E',
  '--dsw-static-green-500-a08': 'rgb(135 160 110 / 8%)',
  '--dsw-static-green-500-a12': 'rgb(135 160 110 / 12%)',
  '--dsw-static-green-400': '#A3BE8C',
  '--dsw-static-green-100': '#B9D0A3',
  '--dsw-static-amber-900': '#A88E4E',
  '--dsw-static-amber-600': '#D0B169',
  '--dsw-static-amber-500': '#D0B169',
  '--dsw-static-amber-400': '#EBCB8B',
  '--dsw-static-amber-100': '#F3DDA8',
}

exports.name = 'dsh-nord-theme'
exports.inject = ['theme']

exports.apply = (ctx) => {
  ctx.effect(() => ctx.theme.register({
    id: 'nord',
    colorScheme: 'dark',
    tokens: NORD_TOKENS,
  }), 'dsh-nord-theme: register')
}
