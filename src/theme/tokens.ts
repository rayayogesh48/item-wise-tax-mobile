import { Platform, type TextStyle, type ViewStyle } from 'react-native';

// Tokens taken from the Karobar "item-wise tax" Figma file.
export const colors = {
  bg: '#faf9fb',
  surface: '#ffffff',
  surfaceMuted: 'rgba(37,0,73,0.05)',
  text: '#211f26',
  textSecondary: '#65636d',
  textDisabled: '#a09ea8',
  primary: '#29ad82',
  primaryPressed: '#129165',
  primarySoft: '#e7f6f0',
  onPrimary: '#ffffff',
  border: 'rgba(28,0,55,0.11)',
  borderSoft: 'rgba(37,0,73,0.05)',
  danger: '#da3a5c',
  dangerSoft: '#fcebef',
  overlay: 'rgba(0,0,0,0.6)',
  toast: '#211f26',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 4, md: 6, card: 8, lg: 12, sheet: 16, pill: 24 } as const;

export const size = { appBar: 56, field: 48, button: 48, touch: 44, maxWidth: 430 } as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const;

const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

export const type = {
  headline: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 28, color: colors.text },
  headlineSm: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 24, color: colors.text },
  title: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 24, color: colors.text },
  titleSm: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: colors.text },
  bodySm: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  label: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  money: tabular,
} satisfies Record<string, TextStyle>;

// "Light Shadow/2" from Figma.
export const cardShadow: ViewStyle = Platform.select({
  web: { boxShadow: '0px 1px 2px rgba(16,24,40,0.05)' } as ViewStyle,
  default: {
    shadowColor: '#101828',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
})!;

export const sheetShadow: ViewStyle = Platform.select({
  web: { boxShadow: '0px -8px 12px -3px rgba(28,59,84,0.08), 0px -2px 6px -2px rgba(28,59,84,0.04)' } as ViewStyle,
  default: {
    shadowColor: '#1c3b54',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
})!;
