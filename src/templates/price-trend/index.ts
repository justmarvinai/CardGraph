import type { ChartRow, Node } from '@/lib/types';
import { withAlpha } from '@/lib/palette';
import {
  daysBetween,
  formatCurrency,
  formatDate,
  formatPercent,
  percentChange,
  spanLabel,
} from '@/lib/format';
import { chartNode, imageNode, rowsFromPairs, softShadow } from '../_shared/nodes';
import { headline, inlineRun, metrics, statsRow, str, num, type StatColumn } from '../_shared/layout';
import type { BuildContext, Template } from '../types';

/**
 * Price Trend — modelled on `positive_graph_movers.jpg` and
 * `negative_card_movers.jpg`.
 *
 * One engine, two gallery entries (Q1): the curve, the arrow and the percentage
 * colour follow the data, so the same template covers a rise and a drop.
 */

function chartRows(data: Record<string, unknown>): ChartRow[] {
  const rows = data.rows;
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r): r is ChartRow => Boolean(r) && typeof r === 'object')
    .map((r, i) => ({
      id: typeof r.id === 'string' ? r.id : `r${i}`,
      label: typeof r.label === 'string' ? r.label : '',
      value: Number(r.value) || 0,
    }));
}

function build(ctx: BuildContext): Node[] {
  const m = metrics(ctx);
  const { palette, formatting, data } = ctx;
  const rows = chartRows(data);
  const nodes: Node[] = [];

  const tall = m.archetype === 'tall';
  const landscape = m.archetype === 'landscape';
  const square = m.archetype === 'square';

  // ── Header ────────────────────────────────────────────────────────────────
  const headlineSize = m.width * (landscape ? 0.115 : tall ? 0.16 : 0.175);
  const headTop = m.height * (tall ? 0.035 : landscape ? 0.045 : 0.026);
  nodes.push(
    headline({
      x: m.left,
      y: headTop,
      width: m.contentWidth,
      fontSize: headlineSize,
      color: palette.accent,
      text: str(data, 'title', 'CARD NAME'),
      glowColor: withAlpha(palette.accent, 0.55),
    }),
  );

  const sublineSize = m.width * (landscape ? 0.026 : 0.037);
  const sublineY = headTop + headlineSize * 1.03;
  nodes.push(
    ...inlineRun(
      [
        { id: 'subtitle-grade', text: str(data, 'grade'), color: palette.textPrimary },
        { id: 'subtitle-dot', text: str(data, 'grade') && str(data, 'set') ? '·' : '', color: palette.textSecondary },
        { id: 'subtitle-set', text: str(data, 'set'), color: palette.textPrimary },
        {
          id: 'subtitle-number',
          text: str(data, 'cardNumber'),
          color: palette.accent,
          fontWeight: 800,
        },
      ].filter((p) => p.text),
      {
        x: m.left,
        y: sublineY,
        width: m.contentWidth,
        fontSize: sublineSize,
        fontFamily: 'Montserrat',
        fontWeight: 500,
        align: 'left',
        gap: sublineSize * 0.55,
      },
    ),
  );

  // ── Body: slab + chart ────────────────────────────────────────────────────
  const bodyTop = sublineY + sublineSize * (tall ? 2.1 : 1.9);
  const statsHeight = m.height * (tall ? 0.13 : landscape ? 0.2 : 0.165);
  const statsTop = m.height - statsHeight - m.height * (tall ? 0.055 : 0.03);
  const bodyHeight = statsTop - bodyTop - m.height * 0.025;

  let slab: { x: number; y: number; w: number; h: number };
  let chart: { x: number; y: number; w: number; h: number };

  if (tall) {
    // 9:16 — the card leads, the chart sits underneath at full width.
    const slabH = bodyHeight * 0.56;
    const chartH = bodyHeight * 0.38;
    slab = { x: m.left + m.contentWidth * 0.06, y: bodyTop, w: m.contentWidth * 0.88, h: slabH };
    chart = { x: m.left, y: bodyTop + slabH + bodyHeight * 0.06, w: m.contentWidth, h: chartH };
  } else {
    const gap = m.contentWidth * (landscape ? 0.04 : 0.03);
    const slabW = m.contentWidth * (landscape ? 0.36 : 0.475);
    const chartW = m.contentWidth - slabW - gap;
    const chartH = bodyHeight * (square ? 0.92 : 0.95);
    slab = { x: m.left, y: bodyTop, w: slabW, h: bodyHeight };
    chart = {
      x: m.left + slabW + gap,
      y: bodyTop + (bodyHeight - chartH) * 0.35,
      w: chartW,
      h: chartH,
    };
  }

  nodes.push(
    imageNode({
      id: 'card',
      name: 'Card image',
      x: slab.x,
      y: slab.y,
      width: slab.w,
      height: slab.h,
      role: 'card',
      fit: 'contain',
      shadow: softShadow(withAlpha('#000000', 1), m.width * 0.05, 0.55),
    }),
  );

  nodes.push(
    chartNode({
      id: 'chart',
      name: 'Price chart',
      x: chart.x,
      y: chart.y,
      width: chart.w,
      height: chart.h,
      rows,
      panelFill: palette.panel,
      panelOpacity: ctx.theme === 'dark' ? 0.72 : 0.8,
      panelRadius: Math.min(chart.w, chart.h) * 0.07,
      gridColor: palette.divider,
      axisColor: palette.textPrimary,
      axisFontSize: Math.min(chart.w, chart.h * 1.1) * 0.055,
      strokeWidth: Math.max(3, chart.w * 0.012),
      glow: chart.w * 0.035,
      padding: {
        top: 0.08,
        right: 0.06,
        bottom: tall ? 0.16 : 0.13,
        left: tall ? 0.13 : 0.19,
      },
    }),
  );

  // ── Stats ────────────────────────────────────────────────────────────────
  const first = rows[0];
  const last = rows[rows.length - 1];
  const startValue = rows.length ? first.value : num(data, 'startPrice');
  const endValue = rows.length ? last.value : num(data, 'endPrice');
  const change = percentChange(startValue, endValue);
  const rising = change >= 0;
  const changeColor = rising ? palette.positive : palette.negative;

  const columns: StatColumn[] = [
    {
      id: 'stat-start',
      label: str(data, 'startLabel', 'PREVIOUS SALE'),
      value: str(data, 'startPriceText') || formatCurrency(startValue, formatting),
      valueColor: palette.accent,
      badge: {
        kind: str(data, 'startBadgeKind', 'builtin') as 'builtin' | 'text' | 'image',
        badgeId: str(data, 'startBadge', 'ebay'),
        text: str(data, 'startBadgeText'),
        caption: str(data, 'startCaption'),
      },
    },
    {
      id: 'stat-change',
      label: str(data, 'changeLabel', 'PRICE CHANGE'),
      value: str(data, 'changeText') || `${rising ? '▲ ' : '▼ '}${formatPercent(change, formatting)}`,
      valueColor: changeColor,
    },
    {
      id: 'stat-end',
      label: str(data, 'endLabel', 'LATEST SALE'),
      value: str(data, 'endPriceText') || formatCurrency(endValue, formatting),
      valueColor: palette.accent,
      badge: {
        kind: str(data, 'endBadgeKind', 'builtin') as 'builtin' | 'text' | 'image',
        badgeId: str(data, 'endBadge', 'ebay'),
        text: str(data, 'endBadgeText'),
        caption: str(data, 'endCaption'),
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

/** Dates, prices and the percentage follow the chart until the user overrides. */
function derive(
  data: Record<string, unknown>,
  formatting: Parameters<NonNullable<Template['derive']>>[1],
): Record<string, unknown> {
  const rows = chartRows(data);
  if (rows.length < 2) return {};
  const first = rows[0];
  const last = rows[rows.length - 1];
  const change = percentChange(first.value, last.value);
  const days = daysBetween(first.label, last.label);

  return {
    startPriceText: formatCurrency(first.value, formatting),
    endPriceText: formatCurrency(last.value, formatting),
    changeText: `${change >= 0 ? '▲ ' : '▼ '}${formatPercent(change, formatting)}`,
    changeLabel: days ? `${spanLabel(days)} CHANGE` : 'PRICE CHANGE',
    startLabel: formatDate(first.label, formatting),
    endLabel: formatDate(last.label, formatting),
    startCaption: '',
    endCaption: '',
  };
}

const upRows = rowsFromPairs([
  ['2026-08-28', 2760],
  ['2026-08-29', 2820],
  ['2026-08-30', 2980],
  ['2026-08-31', 2870],
  ['2026-09-01', 2795],
  ['2026-09-02', 2990],
  ['2026-09-03', 3010],
  ['2026-09-04', 3500],
]);

const downRows = rowsFromPairs([
  ['2026-02-19', 1725],
  ['2026-03-19', 1290],
  ['2026-04-19', 1680],
  ['2026-05-19', 2240],
  ['2026-06-19', 1780],
  ['2026-07-19', 1180],
  ['2026-08-19', 1090],
  ['2026-09-02', 850],
]);

export const priceTrend: Template = {
  id: 'price-trend',
  name: 'Price Trend',
  description:
    'Card, live price chart and a start / change / latest row. The curve and the percentage follow your data.',
  reference: 'positive_graph_movers.jpg',
  tags: ['chart', 'price', 'movers'],
  variants: [
    {
      id: 'up',
      name: 'Price Trend',
      description: 'A card on the way up — green curve, upward arrow.',
      data: { rows: upRows, title: 'MEW EX', grade: 'PSA 10', set: 'Paldean Fates', cardNumber: '#232' },
    },
    {
      id: 'down',
      name: 'Price Drop',
      description: 'A card losing value — red curve, downward arrow.',
      data: {
        rows: downRows,
        title: 'PIKACHU EX',
        grade: '',
        set: 'Ascended Heroes · Special Illustration Rare',
        cardNumber: '#277',
        startLabel: 'LAUNCH PRICE',
        endLabel: 'CURRENT PRICE',
      },
    },
  ],
  fields: [
    { id: 'title', label: 'Card name', kind: 'text', group: 'Header', placeholder: 'MEW EX' },
    { id: 'grade', label: 'Grade', kind: 'text', group: 'Header', placeholder: 'PSA 10' },
    { id: 'set', label: 'Set', kind: 'text', group: 'Header', placeholder: 'Paldean Fates' },
    { id: 'cardNumber', label: 'Card number', kind: 'text', group: 'Header', placeholder: '#232' },
    { id: 'card', label: 'Card image', kind: 'image', group: 'Card' },
    {
      id: 'rows',
      label: 'Price history',
      kind: 'chartRows',
      group: 'Chart',
      help: 'Dates and prices. The curve, the percentage and the dates below update as you type.',
    },
    { id: 'startLabel', label: 'Left label', kind: 'text', group: 'Stats', derived: true },
    { id: 'startPriceText', label: 'Left value', kind: 'text', group: 'Stats', derived: true },
    { id: 'startBadge', label: 'Left source', kind: 'badge', group: 'Stats' },
    { id: 'startCaption', label: 'Left caption', kind: 'text', group: 'Stats' },
    { id: 'changeLabel', label: 'Middle label', kind: 'text', group: 'Stats', derived: true },
    { id: 'changeText', label: 'Middle value', kind: 'text', group: 'Stats', derived: true },
    { id: 'endLabel', label: 'Right label', kind: 'text', group: 'Stats', derived: true },
    { id: 'endPriceText', label: 'Right value', kind: 'text', group: 'Stats', derived: true },
    { id: 'endBadge', label: 'Right source', kind: 'badge', group: 'Stats' },
    { id: 'endCaption', label: 'Right caption', kind: 'text', group: 'Stats' },
  ],
  defaults: {
    title: 'MEW EX',
    grade: 'PSA 10',
    set: 'Paldean Fates',
    cardNumber: '#232',
    rows: upRows,
    startBadge: 'ebay',
    endBadge: 'ebay',
    startBadgeKind: 'builtin',
    endBadgeKind: 'builtin',
    startCaption: '',
    endCaption: '',
  },
  derive,
  nodeFields: {
    headline: 'title',
    'subtitle-grade': 'grade',
    'subtitle-set': 'set',
    'subtitle-number': 'cardNumber',
    'stat-start-label': 'startLabel',
    'stat-start-value': 'startPriceText',
    'stat-change-label': 'changeLabel',
    'stat-change-value': 'changeText',
    'stat-end-label': 'endLabel',
    'stat-end-value': 'endPriceText',
  },
  build,
};
