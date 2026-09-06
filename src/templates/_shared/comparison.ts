import type { Node } from '@/lib/types';
import { withAlpha } from '@/lib/palette';
import { formatCurrency, formatPercent, percentChange } from '@/lib/format';
import { dividerNode, imageNode, softShadow, textNode } from './nodes';
import { headline, inlineRun, metrics, statsRow, str, num, type StatColumn } from './layout';
import type { BuildContext } from '../types';

/**
 * Two slabs, an accent split down the middle and a three-stat footer.
 * Shared by "Grade Comparison" and "Sale Comparison", which differ only in the
 * header treatment and the stat labels.
 */
export interface ComparisonOptions {
  /** `captions` puts a line above each slab; `subline` puts one under the headline. */
  header: 'captions' | 'subline';
  leftLabelDefault: string;
  changeLabelDefault: string;
  rightLabelDefault: string;
  /** Absolute difference (grades) reads better than signed change (time). */
  changeMode: 'difference' | 'change';
}

export function buildComparison(ctx: BuildContext, options: ComparisonOptions): Node[] {
  const m = metrics(ctx);
  const { palette, formatting, data } = ctx;
  const nodes: Node[] = [];
  const tall = m.archetype === 'tall';
  const landscape = m.archetype === 'landscape';

  const headlineSize = m.width * (landscape ? 0.1 : tall ? 0.15 : 0.155);
  const headTop = m.height * (tall ? 0.04 : landscape ? 0.05 : 0.03);
  const centred = options.header === 'captions';

  nodes.push(
    headline({
      x: m.left,
      y: headTop,
      width: m.contentWidth,
      fontSize: headlineSize,
      align: centred ? 'left' : 'left',
      color: palette.accent,
      text: str(data, 'title', 'CARD NAME'),
      glowColor: withAlpha(palette.accent, 0.5),
    }),
  );

  let bodyTop = headTop + headlineSize * 1.12;

  if (options.header === 'subline') {
    const sublineSize = m.width * (landscape ? 0.024 : 0.034);
    nodes.push(
      ...inlineRun(
        [
          { id: 'subtitle-grade', text: str(data, 'grade'), color: palette.textPrimary },
          { id: 'subtitle-set', text: str(data, 'set'), color: palette.textPrimary },
          { id: 'subtitle-number', text: str(data, 'cardNumber'), color: palette.accent, fontWeight: 800 },
        ].filter((p) => p.text),
        {
          x: m.left,
          y: bodyTop - headlineSize * 0.04,
          width: m.contentWidth,
          fontSize: sublineSize,
          fontFamily: 'Montserrat',
          fontWeight: 500,
          align: 'left',
          gap: sublineSize * 0.55,
        },
      ),
    );
    bodyTop += sublineSize * 1.9;
  }

  const statsHeight = m.height * (tall ? 0.125 : landscape ? 0.2 : 0.16);
  const statsTop = m.height - statsHeight - m.height * (tall ? 0.05 : 0.03);
  const gutter = m.contentWidth * 0.035;
  const columnWidth = (m.contentWidth - gutter) / 2;

  let slabTop = bodyTop + m.height * 0.015;

  if (options.header === 'captions') {
    const captionSize = m.width * (landscape ? 0.021 : 0.03);
    const captions = [str(data, 'leftCaption'), str(data, 'rightCaption')];
    captions.forEach((text, i) => {
      nodes.push(
        textNode({
          id: i === 0 ? 'caption-left' : 'caption-right',
          name: i === 0 ? 'Left caption' : 'Right caption',
          x: m.left + (columnWidth + gutter) * i,
          y: slabTop,
          width: columnWidth,
          height: captionSize * 1.4,
          color: palette.textPrimary,
          text,
          fontFamily: 'Montserrat',
          fontWeight: 500,
          fontSize: captionSize,
          letterSpacing: 0.01,
          align: 'center',
          transform: 'uppercase',
          autoFit: true,
        }),
      );
    });
    slabTop += captionSize * 2.1;
  }

  const slabHeight = statsTop - slabTop - m.height * 0.03;

  [0, 1].forEach((i) => {
    nodes.push(
      imageNode({
        id: i === 0 ? 'card' : 'card-right',
        name: i === 0 ? 'Left card' : 'Right card',
        x: m.left + (columnWidth + gutter) * i,
        y: slabTop,
        width: columnWidth,
        height: slabHeight,
        role: 'card',
        fit: 'contain',
        shadow: softShadow(withAlpha('#000000', 1), m.width * 0.045, 0.5),
      }),
    );
  });

  nodes.push(
    dividerNode({
      id: 'split',
      name: 'Centre split',
      x: m.width / 2 - Math.max(1, m.u * 1.5) / 2,
      y: slabTop + slabHeight * 0.02,
      width: Math.max(1, m.u * 1.5),
      height: slabHeight * 0.96,
      orientation: 'vertical',
      thickness: Math.max(1, m.u * 1.5),
      color: withAlpha(palette.accent, 0.75),
      fade: 1,
    }),
  );

  const leftPrice = num(data, 'leftPrice');
  const rightPrice = num(data, 'rightPrice');
  const diff =
    options.changeMode === 'difference'
      ? Math.abs(percentChange(leftPrice, rightPrice))
      : percentChange(leftPrice, rightPrice);
  const rising = percentChange(leftPrice, rightPrice) >= 0;

  const columns: StatColumn[] = [
    {
      id: 'stat-left',
      label: str(data, 'leftLabel', options.leftLabelDefault),
      value: str(data, 'leftPriceText') || formatCurrency(leftPrice, formatting),
      valueColor: palette.accent,
      badge: {
        kind: str(data, 'leftBadgeKind', 'builtin') as 'builtin' | 'text' | 'image',
        badgeId: str(data, 'leftBadge', 'ebay'),
        text: str(data, 'leftBadgeText'),
        caption: str(data, 'leftCaptionDate'),
      },
    },
    {
      id: 'stat-change',
      label: str(data, 'changeLabel', options.changeLabelDefault),
      value:
        str(data, 'changeText') ||
        (options.changeMode === 'difference'
          ? `${rising ? '+' : '−'}${formatPercent(diff, formatting, 0)}`
          : formatPercent(diff, formatting)),
      valueColor:
        options.changeMode === 'difference'
          ? palette.textPrimary
          : rising
            ? palette.positive
            : palette.negative,
      prefix: options.changeMode === 'difference' ? '' : rising ? '▲ ' : '▼ ',
    },
    {
      id: 'stat-right',
      label: str(data, 'rightLabel', options.rightLabelDefault),
      value: str(data, 'rightPriceText') || formatCurrency(rightPrice, formatting),
      valueColor: palette.accent,
      badge: {
        kind: str(data, 'rightBadgeKind', 'builtin') as 'builtin' | 'text' | 'image',
        badgeId: str(data, 'rightBadge', 'fanatics'),
        text: str(data, 'rightBadgeText'),
        caption: str(data, 'rightCaptionDate'),
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
