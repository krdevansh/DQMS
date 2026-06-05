export const dqmsTheme = {
  name: 'dqms' as const,
  colors: {
    bg: '#F5F7FA',
    primary: '#2563EB',
    secondary: '#1E293B',
    accent: '#06B6D4',
    white: '#FFFFFF',
    cardBg: '#FFFFFF',
    text: '#1E293B',
    textMuted: '#64748B',
  },
  shadows: {
    card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    cardHover: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  borderRadius: {
    card: '16px',
    button: '12px',
  },
  fonts: {
    heading: 'Inter',
    body: 'Inter',
  },
};

export type DQMSTheme = typeof dqmsTheme;