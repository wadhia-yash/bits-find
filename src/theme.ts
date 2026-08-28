/**
 * BTS Find — design tokens.
 * Single source of truth for colours, spacing and type scale.
 */

export const colors = {
  navy: '#12294D',
  navyDark: '#0B1B33',
  navyLight: '#1E3F6F',
  blue: '#1F6FEB',
  blueDeep: '#0B4FCC',
  blueSoft: '#E8F0FE',
  bg: '#F4F6FA',
  bgElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  border: '#E4E8EF',
  borderStrong: '#D3D9E3',
  text: '#0F1729',
  textMuted: '#5C6B82',
  textFaint: '#94A1B4',
  green: '#0B8A4B',
  greenSoft: '#E4F6EC',
  amber: '#A85F00',
  amberSoft: '#FDF2E3',
  red: '#C2321F',
  redSoft: '#FCEBE9',
  purple: '#5B4DBE',
  purpleSoft: '#EEECFA',
  grey: '#5C6B82',
  greySoft: '#EDF0F5',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
};

/** 44pt minimum touch target — NFR #31. */
export const TOUCH_TARGET = 44;

export const font = {
  display: { fontSize: 30, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.5 },
  h1: { fontSize: 26, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.4 },
  h2: { fontSize: 20, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.2 },
  h3: { fontSize: 16, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  label: { fontSize: 13, fontWeight: '600' as const, color: colors.textMuted },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.textMuted },
};

/** Two depths: resting cards, and things that float above the page. */
export const shadow = {
  shadowColor: '#0F1729',
  shadowOpacity: 0.05,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

export const shadowLifted = {
  shadowColor: '#0F1729',
  shadowOpacity: 0.16,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
};
