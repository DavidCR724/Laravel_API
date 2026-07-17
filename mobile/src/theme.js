// Paleta compartida con el panel de administración (sombrerería).
export const colors = {
  cream: '#FAF7F2',
  white: '#FFFFFF',

  gold: '#D4AF37',
  goldLight: '#E5C765',
  goldDark: '#AD8A2A',

  leather: '#5C4033',
  leatherLight: '#7A5A46',
  leatherDark: '#3E2B22',

  denim: '#2E4053',
  denimLight: '#3E5570',
  denimDark: '#1C2833',

  // Estados
  success: '#059669',
  successBg: '#D1FAE5',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  danger: '#E11D48',
  dangerBg: '#FFE4E6',

  border: '#E7E0D6',
  muted: '#9A8F82',
}

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 }

export const spacing = (n) => n * 4

export const money = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0)
