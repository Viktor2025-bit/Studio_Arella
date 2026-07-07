/**
 * Studio Arella design tokens.
 *
 * Source of truth for color/spacing/radius/shadow/font values used in inline
 * `style={{}}` objects across the app. Keep in sync with the CSS custom
 * properties in `app/globals.css` — this is the "app" (JS) copy, globals.css
 * is the "system" (CSS) copy, both carry the same values.
 */

export const theme = {
  color: {
    bg: 'var(--bg)',
    surface: 'var(--surface)',
    surface2: 'var(--surface-2)',
    border: 'var(--border)',
    border2: 'var(--border-2)',

    charcoal900: 'var(--charcoal-900)',
    charcoal800: 'var(--charcoal-800)',
    charcoal700: 'var(--charcoal-700)',

    text1: 'var(--text-1)',
    text2: 'var(--text-2)',
    text3: 'var(--text-3)',
    text4: 'var(--text-4)',

    gold: 'var(--gold)',
    goldDark: 'var(--gold-dark)',
    goldLight: 'var(--gold-light)',
    goldMid: 'var(--gold-mid)',

    glitchCyan: 'var(--glitch-cyan)',
    glitchMagenta: 'var(--glitch-magenta)',

    success: 'var(--success)',
    successLight: 'var(--success-light)',
    warning: 'var(--warning)',
    warningLight: 'var(--warning-light)',
    error: 'var(--error)',
    errorLight: 'var(--error-light)',
    info: 'var(--info)',
    infoLight: 'var(--info-light)',
    infoBorder: 'var(--info-border)',
  },
  space: {
    1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 10: 40, 12: 48,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
  },
  shadow: {
    sm: '0 2px 8px rgba(33,29,23,0.06)',
    md: '0 10px 30px rgba(33,29,23,0.07)',
    lg: '0 20px 40px rgba(33,29,23,0.10)',
    gold: '0 8px 20px rgba(224,165,38,0.30)',
  },
  font: {
    body: 'var(--font-body)',
    display: 'var(--font-display)',
  },
  motion: {
    easing: [0.25, 0.46, 0.45, 0.94] as const,
  },
} as const;

export type Theme = typeof theme;
