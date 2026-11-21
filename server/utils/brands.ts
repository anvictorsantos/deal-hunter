export const BRAND_ORDER = ['Sony', 'Microsoft', 'Nintendo', 'Sega', 'Atari', 'PC & Mobile', 'Other'] as const

const BRAND_BY_SLUG: Record<string, string> = {
  'playstation5': 'Sony', 'playstation4': 'Sony', 'playstation3': 'Sony', 'playstation2': 'Sony',
  'playstation1': 'Sony', 'psp': 'Sony', 'ps-vita': 'Sony',
  'xbox-series-x': 'Microsoft', 'xbox-one': 'Microsoft', 'xbox360': 'Microsoft', 'xbox-old': 'Microsoft',
  'nintendo-switch': 'Nintendo', 'nintendo-3ds': 'Nintendo', 'nintendo-ds': 'Nintendo', 'nintendo-dsi': 'Nintendo',
  'wii-u': 'Nintendo', 'wii': 'Nintendo', 'gamecube': 'Nintendo', 'nintendo-64': 'Nintendo',
  'game-boy-advance': 'Nintendo', 'game-boy-color': 'Nintendo', 'game-boy': 'Nintendo', 'snes': 'Nintendo', 'nes': 'Nintendo',
  'genesis': 'Sega', 'sega-saturn': 'Sega', 'sega-cd': 'Sega', 'sega-32x': 'Sega', 'sega-master-system': 'Sega',
  'dreamcast': 'Sega', 'game-gear': 'Sega',
  'atari-7800': 'Atari', 'atari-5200': 'Atari', 'atari-2600': 'Atari', 'atari-flashback': 'Atari',
  'atari-8-bit': 'Atari', 'atari-st': 'Atari', 'atari-lynx': 'Atari', 'atari-xegs': 'Atari', 'jaguar': 'Atari',
  'pc': 'PC & Mobile', 'macos': 'PC & Mobile', 'linux': 'PC & Mobile', 'ios': 'PC & Mobile',
  'android': 'PC & Mobile', 'web': 'PC & Mobile', 'macintosh': 'PC & Mobile', 'apple-ii': 'PC & Mobile',
  'commodore-amiga': 'PC & Mobile',
}

export function brandForSlug(slug: string) {
  return BRAND_BY_SLUG[slug] ?? 'Other'
}
