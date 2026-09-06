/**
 * Source marks shown under a price ("eBay · AUG 31, 2026").
 *
 * These are our own wordmarks — recreated with our fonts and colours, not the
 * companies' logo files. Users can always pick `text` or upload their own.
 */

export interface BadgeSegment {
  text: string;
  /** `null` = follow the badge node's colour, so the palette stays in charge. */
  color: string | null;
}

export interface BuiltinBadge {
  id: string;
  name: string;
  segments: BadgeSegment[];
  fontFamily: string;
  fontWeight: number;
  letterSpacing: number;
  italic?: boolean;
  /** Multiplies the node's font size — some wordmarks read smaller. */
  scale?: number;
}

export const BUILTIN_BADGES: BuiltinBadge[] = [
  {
    id: 'ebay',
    name: 'eBay',
    segments: [
      { text: 'e', color: '#E53238' },
      { text: 'b', color: '#0064D2' },
      { text: 'a', color: '#F5AF02' },
      { text: 'y', color: '#86B817' },
    ],
    fontFamily: 'Montserrat',
    fontWeight: 700,
    letterSpacing: -0.01,
    italic: true,
  },
  {
    id: 'fanatics',
    name: 'Fanatics Collect',
    segments: [
      { text: '▰ ', color: '#D0021B' },
      { text: 'Fanatics', color: null },
    ],
    fontFamily: 'Montserrat',
    fontWeight: 700,
    letterSpacing: -0.005,
  },
  {
    id: 'alt',
    name: 'ALT',
    segments: [{ text: 'ALT', color: null }],
    fontFamily: 'Space Grotesk',
    fontWeight: 700,
    letterSpacing: 0.02,
  },
  {
    id: 'tcgplayer',
    name: 'TCGplayer',
    segments: [
      { text: 'TCG', color: null },
      { text: 'player', color: '#F5A623' },
    ],
    fontFamily: 'Montserrat',
    fontWeight: 700,
    letterSpacing: -0.01,
  },
  {
    id: 'pwcc',
    name: 'PWCC',
    segments: [{ text: 'PWCC', color: null }],
    fontFamily: 'Oswald',
    fontWeight: 600,
    letterSpacing: 0.06,
  },
  {
    id: 'goldin',
    name: 'Goldin',
    segments: [{ text: 'GOLDIN', color: null }],
    fontFamily: 'Montserrat',
    fontWeight: 600,
    letterSpacing: 0.14,
    scale: 0.92,
  },
  {
    id: 'heritage',
    name: 'Heritage',
    segments: [{ text: 'HERITAGE', color: null }],
    fontFamily: 'Oswald',
    fontWeight: 500,
    letterSpacing: 0.1,
    scale: 0.92,
  },
  {
    id: 'psa',
    name: 'PSA',
    segments: [{ text: 'PSA', color: null }],
    fontFamily: 'Montserrat',
    fontWeight: 800,
    letterSpacing: 0.04,
  },
  {
    id: 'cgc',
    name: 'CGC',
    segments: [{ text: 'CGC', color: null }],
    fontFamily: 'Montserrat',
    fontWeight: 800,
    letterSpacing: 0.04,
  },
  {
    id: 'bgs',
    name: 'Beckett (BGS)',
    segments: [{ text: 'BGS', color: null }],
    fontFamily: 'Montserrat',
    fontWeight: 800,
    letterSpacing: 0.04,
  },
  {
    id: 'tag',
    name: 'TAG',
    segments: [{ text: 'TAG', color: null }],
    fontFamily: 'Space Grotesk',
    fontWeight: 700,
    letterSpacing: 0.06,
  },
  {
    id: 'ace',
    name: 'ACE',
    segments: [{ text: 'ACE', color: null }],
    fontFamily: 'Space Grotesk',
    fontWeight: 700,
    letterSpacing: 0.06,
  },
];

export function getBadge(id: string): BuiltinBadge | undefined {
  return BUILTIN_BADGES.find((b) => b.id === id);
}
