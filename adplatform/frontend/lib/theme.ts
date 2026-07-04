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
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    surface2: '#F1F5F9',
    border: '#E2E8F0',
    border2: '#CBD5E1',

    charcoal900: '#1A1A1A',
    charcoal800: '#262220',
    charcoal700: '#3D3833',

    text1: '#0F172A',
    text2: '#334155',
    text3: '#64748B',
    text4: '#94A3B8',

    gold: '#E0A526',
    goldDark: '#B8841A',
    goldLight: '#FBF0DA',
    goldMid: '#EFC65E',

    // Rare use only: hero underline, live/on-air glow, one featured badge.
    // Never buttons, links, or general status colors.
    glitchCyan: '#00E5FF',
    glitchMagenta: '#FF2FB0',

    success: '#4C9A5A',
    successLight: '#E9F3E4',
    warning: '#D98E2B',
    warningLight: '#FBEEDA',
    error: '#C9483A',
    errorLight: '#F7E7E2',
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
