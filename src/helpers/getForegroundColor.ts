import colorContrast from 'color-contrast'

export function getForegroundColor(bg: string) {
  const black = colorContrast('#000000', bg)
  const white = colorContrast('#FFFFFF', bg)

  return black > white ? '#000000' : '#FFFFFF'
}
