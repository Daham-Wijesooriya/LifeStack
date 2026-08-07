/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Values come from CSS custom properties set at runtime by
      // ThemeProvider (see src/theme/tokens.ts -> toCssVars). Keep these
      // variable names in sync with CSS_VAR_NAMES in that file.
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-alt': 'var(--color-surface-alt)',
        border: 'var(--color-border)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        primary: 'var(--color-primary)',
        'primary-text': 'var(--color-primary-text)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        info: 'var(--color-info)',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '48px',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
      },
      // Mirrors `typography` in src/theme/tokens.ts so `<Text variant="lg">`
      // and any raw `className="text-lg"` usage stay pixel-identical.
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '22px' }],
        lg: ['18px', { lineHeight: '24px' }],
        xl: ['22px', { lineHeight: '28px' }],
        '2xl': ['28px', { lineHeight: '34px' }],
      },
    },
  },
  plugins: [],
};
