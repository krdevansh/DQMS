export const salonTheme = {
  name: 'salon' as const,
  colors: {
    bg: '#0D0D0D',
    secondary: '#161616',
    gold: '#D4AF37',
    neon: '#FF8C42',
    text: '#F5F5F5',
    textMuted: '#A0A0A0',
    glass: 'rgba(255,255,255,0.05)',
    cardBg: 'rgba(22,22,22,0.8)',
  },
  shadows: {
    card: '0 4px 20px rgba(0,0,0,0.5)',
    gold: '0 0 30px rgba(212,175,55,0.3)',
    neon: '0 0 20px rgba(255,140,66,0.4)',
  },
  borderRadius: {
    card: '20px',
    button: '14px',
  },
  fonts: {
    heading: 'Poppins',
    body: 'Montserrat',
  },
  effects: {
    glassBlur: 'blur(20px)',
    goldBorder: '1px solid rgba(212,175,55,0.3)',
    neonGlow: '0 0 20px rgba(255,140,66,0.5)',
  },
};

export type SalonTheme = typeof salonTheme;