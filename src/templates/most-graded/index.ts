import type { Node } from '@/lib/types';
import { withAlpha } from '@/lib/palette';
import { formatCurrency, formatNumber } from '@/lib/format';
import { imageNode, softShadow, textNode } from '../_shared/nodes';
import { headline, inlineRun, metrics, statsRow, str, num, dateCaption, type StatColumn } from '../_shared/layout';
import type { BuildContext, Template } from '../types';

/** Modelled on `most_graded_cards.jpg`. */
function build(ctx: BuildContext): Node[] {
  const m = metrics(ctx);
  const { palette, formatting, data } = ctx;
  const nodes: Node[] = [];
  const tall = m.archetype === 'tall';
  const landscape = m.archetype === 'landscape';

  // Oversized grade number behind everything — the signature of this layout.
  const watermarkSize = m.height * (landscape ? 0.42 : 0.26);
  nodes.push(
    textNode({
      id: 'watermark',
      name: 'Grade watermark',
      x: m.left - watermarkSize * 0.08,
      y: -watermarkSize * 0.05,
      width: watermarkSize * 2,
      height: watermarkSize * 1.1,
      color: withAlpha(palette.textPrimary, ctx.theme === 'dark' ? 0.09 : 0.1),
      text: str(data, 'watermark', '10'),
      fontFamily: 'Anton',
      fontWeight: 400,
      fontSize: watermarkSize,
      letterSpacing: -0.03,
      lineHeight: 1,
      align: 'left',
    }),
  );

  const headlineSize = m.width * (landscape ? 0.1 : tall ? 0.15 : 0.155);
  const headTop = m.height * (tall ? 0.04 : 0.028);
  nodes.push(
    headline({
      x: m.left,
      y: headTop,
      width: m.contentWidth,
      fontSize: headlineSize,
      align: 'right',
      color: palette.accent,
      text: str(data, 'title', 'CARD NAME'),
      glowColor: withAlpha(palette.accent, 0.5),
    }),
  );

  const sublineSize = m.width * (landscape ? 0.023 : 0.033);
  const sublineY = headTop + headlineSize * 1.06;
  nodes.push(
    ...inlineRun(
      [
        { id: 'subtitle-year', text: str(data, 'year'), color: palette.accent, fontWeight: 700 },
        { id: 'subtitle-dot', text: str(data, 'year') && str(data, 'set') ? '·' : '', color: palette.textSecondary },
        { id: 'subtitle-set', text: str(data, 'set'), color: palette.textPrimary },
        { id: 'subtitle-number', text: str(data, 'cardNumber'), color: palette.accent, fontWeight: 800 },
      ].filter((p) => p.text),
      {
        x: m.left,
        y: sublineY,
        width: m.contentWidth,
        fontSize: sublineSize,
        fontFamily: 'Montserrat',
        fontWeight: 500,
        align: 'right',
        gap: sublineSize * 0.5,
      },
    ),
  );

  const statsHeight = m.height * (tall ? 0.12 : landscape ? 0.2 : 0.15);
  const statsTop = m.height - statsHeight - m.height * (tall ? 0.05 : 0.035);
  const slabTop = sublineY + sublineSize * 2.2;
  const slabHeight = statsTop - slabTop - m.height * 0.035;
  const slabWidth = Math.min(m.contentWidth * (landscape ? 0.42 : 0.72), slabHeight * 0.72);

  nodes.push(
    imageNode({
      id: 'card',
      name: 'Card image',
      x: (m.width - slabWidth) / 2,
      y: slabTop,
      width: slabWidth,
      height: slabHeight,
      role: 'card',
      fit: 'contain',
      shadow: softShadow(withAlpha('#000000', 1), m.width * 0.05, 0.55),
    }),
  );

  const columns: StatColumn[] = [
    {
      id: 'stat-total',
      label: str(data, 'totalLabel', 'TOTAL GRADED'),
      value: str(data, 'totalText') || formatNumber(num(data, 'total'), formatting),
      valueColor: palette.textPrimary,
    },
    {
      id: 'stat-pop',
      label: str(data, 'popLabel', 'PSA 10 POP'),
      value: str(data, 'popText') || formatNumber(num(data, 'pop'), formatting),
      valueColor: palette.textPrimary,
    },
    {
      id: 'stat-sale',
      label: str(data, 'saleLabel', 'LATEST SALE'),
      value: str(data, 'saleText') || formatCurrency(num(data, 'sale'), formatting),
      valueColor: palette.accent,
      badge: {
        kind: str(data, 'saleBadgeKind', 'builtin') as 'builtin' | 'text' | 'image',
        badgeId: str(data, 'saleBadge', 'ebay'),
        text: str(data, 'saleBadgeText'),
        caption: dateCaption(data, 'saleCaption', formatting),
      },
    },
  ];

  nodes.push(
    ...statsRow(ctx, m, {
      x: m.left,
      y: statsTop,
      width: m.contentWidth,
      height: statsHeight,
      columns,
    }),
  );

  return nodes;
}

export const mostGraded: Template = {
  id: 'most-graded',
  name: 'Population Report',
  description: 'One card, a giant grade watermark and the population numbers behind it.',
  reference: 'most_graded_cards.jpg',
  tags: ['population', 'grading', 'single card'],
  variants: [],
  fields: [
    { id: 'watermark', label: 'Watermark', kind: 'text', group: 'Header', help: 'The oversized number behind the header.' },
    { id: 'title', label: 'Card name', kind: 'text', group: 'Header', placeholder: 'EEVEE' },
    { id: 'year', label: 'Year', kind: 'text', group: 'Header', placeholder: '2025' },
    { id: 'set', label: 'Set', kind: 'text', group: 'Header', placeholder: 'Scarlet & Violet Promo' },
    { id: 'cardNumber', label: 'Card number', kind: 'text', group: 'Header', placeholder: '#173' },
    { id: 'card', label: 'Card image', kind: 'image', group: 'Card' },
    { id: 'totalLabel', label: 'Left label', kind: 'text', group: 'Stats' },
    { id: 'total', label: 'Total graded', kind: 'number', group: 'Stats' },
    { id: 'popLabel', label: 'Middle label', kind: 'text', group: 'Stats' },
    { id: 'pop', label: 'Population', kind: 'number', group: 'Stats' },
    { id: 'saleLabel', label: 'Right label', kind: 'text', group: 'Stats' },
    { id: 'sale', label: 'Latest sale', kind: 'currency', group: 'Stats' },
    { id: 'saleBadge', label: 'Sale source', kind: 'badge', group: 'Stats' },
    { id: 'saleCaption', label: 'Sale date', kind: 'date', group: 'Stats' },
  ],
  defaults: {
    watermark: '10',
    title: 'EEVEE',
    year: '2025',
    set: 'Scarlet & Violet Promo',
    cardNumber: '#173',
    totalLabel: 'TOTAL GRADED',
    popLabel: 'PSA 10 POP',
    saleLabel: 'LATEST SALE',
    total: 82868,
    pop: 31100,
    sale: 130,
    saleBadge: 'ebay',
    saleCaption: '2026-09-05',
  },
  derive: (data, formatting) => ({
    totalText: formatNumber(num(data, 'total'), formatting),
    popText: formatNumber(num(data, 'pop'), formatting),
    saleText: formatCurrency(num(data, 'sale'), formatting),
  }),
  nodeFields: {
    headline: 'title',
    watermark: 'watermark',
    'subtitle-year': 'year',
    'subtitle-set': 'set',
    'subtitle-number': 'cardNumber',
    'stat-total-label': 'totalLabel',
    'stat-total-value': 'totalText',
    'stat-pop-label': 'popLabel',
    'stat-pop-value': 'popText',
    'stat-sale-label': 'saleLabel',
    'stat-sale-value': 'saleText',
  },
  build,
};
