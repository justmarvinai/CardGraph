import type { Node } from '@/lib/types';
import { withAlpha } from '@/lib/palette';
import { formatCurrency } from '@/lib/format';
import { badgeNode, dividerNode, imageNode, softShadow, textNode } from '../_shared/nodes';
import { headline, metrics, str, num } from '../_shared/layout';
import type { BuildContext, Template } from '../types';

/** Modelled on `top_card_sales_of_month_day_week_year.jpg`. */
function build(ctx: BuildContext): Node[] {
  const m = metrics(ctx);
  const { palette, formatting, data } = ctx;
  const nodes: Node[] = [];
  const tall = m.archetype === 'tall';
  const landscape = m.archetype === 'landscape';

  const gutter = m.contentWidth * 0.04;
  const columnWidth = (m.contentWidth - gutter) / 2;
  const headlineSize = columnWidth * (landscape ? 0.16 : 0.2);
  const headTop = m.height * (tall ? 0.04 : 0.03);
  const sublineSize = m.width * (landscape ? 0.019 : 0.027);

  const eyebrow = str(data, 'eyebrow');
  let top = headTop;
  if (eyebrow) {
    nodes.push(
      textNode({
        id: 'eyebrow',
        name: 'Eyebrow',
        x: m.left,
        y: top,
        width: m.contentWidth,
        height: sublineSize * 1.5,
        color: palette.textSecondary,
        text: eyebrow,
        fontFamily: 'Montserrat',
        fontWeight: 600,
        fontSize: sublineSize * 1.05,
        letterSpacing: 0.16,
        align: 'center',
        transform: 'uppercase',
      }),
    );
    top += sublineSize * 2.4;
  }

  const sides: ('left' | 'right')[] = ['left', 'right'];
  const sublineTop = top + headlineSize * 1.05;
  const bodyTop = sublineTop + sublineSize * 3.4;

  const footerHeight = m.height * (tall ? 0.15 : landscape ? 0.24 : 0.185);
  const footerTop = m.height - footerHeight - m.height * (tall ? 0.05 : 0.03);
  const slabHeight = footerTop - bodyTop - m.height * 0.03;

  sides.forEach((side, i) => {
    const x = m.left + (columnWidth + gutter) * i;
    const suffix = i === 0 ? '' : '-right';

    nodes.push(
      headline({
        id: `headline${suffix}`,
        x,
        y: top,
        width: columnWidth,
        fontSize: headlineSize,
        align: 'center',
        color: palette.accent,
        text: str(data, `${side}Title`, 'CARD NAME'),
        glowColor: withAlpha(palette.accent, 0.5),
      }),
    );

    nodes.push(
      textNode({
        id: `subtitle${suffix}`,
        name: `${side === 'left' ? 'Left' : 'Right'} subline`,
        x,
        y: sublineTop,
        width: columnWidth,
        height: sublineSize * 3,
        color: palette.textPrimary,
        text: str(data, `${side}Subtitle`),
        fontFamily: 'Montserrat',
        fontWeight: 500,
        fontSize: sublineSize,
        lineHeight: 1.35,
        align: 'center',
      }),
    );

    nodes.push(
      imageNode({
        id: i === 0 ? 'card' : 'card-right',
        name: `${side === 'left' ? 'Left' : 'Right'} card`,
        x,
        y: bodyTop,
        width: columnWidth,
        height: slabHeight,
        role: 'card',
        fit: 'contain',
        shadow: softShadow(withAlpha('#000000', 1), m.width * 0.045, 0.5),
      }),
    );

    const rankSize = footerHeight * 0.2;
    const priceSize = footerHeight * 0.36;
    nodes.push(
      textNode({
        id: `rank${suffix}`,
        name: `${side === 'left' ? 'Left' : 'Right'} rank`,
        x,
        y: footerTop + footerHeight * 0.1,
        width: columnWidth,
        height: rankSize * 1.4,
        color: palette.textPrimary,
        text: str(data, `${side}Rank`),
        fontFamily: 'Montserrat',
        fontWeight: 500,
        fontSize: rankSize,
        letterSpacing: 0.05,
        align: 'center',
        transform: 'uppercase',
        autoFit: true,
      }),
    );

    nodes.push(
      textNode({
        id: `price${suffix}`,
        name: `${side === 'left' ? 'Left' : 'Right'} price`,
        x: x + columnWidth * 0.02,
        y: footerTop + footerHeight * 0.1 + rankSize * 1.7,
        width: columnWidth * 0.96,
        height: priceSize * 1.2,
        color: palette.accent,
        text: str(data, `${side}PriceText`) || formatCurrency(num(data, `${side}Price`), formatting),
        fontFamily: 'Montserrat',
        fontWeight: 800,
        fontSize: priceSize,
        letterSpacing: -0.01,
        align: 'center',
        autoFit: true,
        minFontSize: priceSize * 0.5,
      }),
    );

    nodes.push(
      badgeNode({
        id: `source${suffix}`,
        name: `${side === 'left' ? 'Left' : 'Right'} source`,
        x,
        y: footerTop + footerHeight * 0.1 + rankSize * 1.7 + priceSize * 1.28,
        width: columnWidth,
        height: footerHeight * 0.15,
        color: palette.textPrimary,
        kind: str(data, `${side}BadgeKind`, 'builtin') as 'builtin' | 'text' | 'image',
        badgeId: str(data, `${side}Badge`, 'fanatics'),
        text: str(data, `${side}BadgeText`),
        caption: str(data, `${side}Caption`),
        captionColor: palette.textSecondary,
        captionFontSize: footerHeight * 0.13,
        align: 'center',
      }),
    );
  });

  nodes.push(
    dividerNode({
      id: 'split',
      name: 'Centre split',
      x: m.width / 2 - Math.max(1, m.u * 1.5) / 2,
      y: bodyTop,
      width: Math.max(1, m.u * 1.5),
      height: slabHeight,
      orientation: 'vertical',
      thickness: Math.max(1, m.u * 1.5),
      color: withAlpha(palette.accent, 0.7),
      fade: 1,
    }),
  );

  nodes.push(
    dividerNode({
      id: 'footer-rule',
      name: 'Footer rule',
      x: m.left,
      y: footerTop,
      width: m.contentWidth,
      height: Math.max(1.5, m.u * 2),
      thickness: Math.max(1.5, m.u * 2),
      color: withAlpha(palette.divider, 0.28),
    }),
  );

  nodes.push(
    dividerNode({
      id: 'footer-sep',
      name: 'Footer separator',
      x: m.width / 2,
      y: footerTop + footerHeight * 0.12,
      width: Math.max(1, m.u * 1.5),
      height: footerHeight * 0.8,
      orientation: 'vertical',
      thickness: Math.max(1, m.u * 1.5),
      color: withAlpha(palette.divider, 0.22),
    }),
  );

  nodes.push(
    dividerNode({
      id: 'footer-rule-bottom',
      name: 'Bottom rule',
      x: m.left,
      y: footerTop + footerHeight,
      width: m.contentWidth,
      height: Math.max(1.5, m.u * 2),
      thickness: Math.max(1.5, m.u * 2),
      color: withAlpha(palette.divider, 0.28),
    }),
  );

  return nodes;
}

export const topSalesDuo: Template = {
  id: 'top-sales-duo',
  name: 'Top Sales Duo',
  description: 'Two headline sales side by side with their rank, price and marketplace.',
  reference: 'top_card_sales_of_month_day_week_year.jpg',
  tags: ['sales', 'ranking', 'duo'],
  variants: [],
  fields: [
    { id: 'eyebrow', label: 'Eyebrow', kind: 'text', group: 'Header', placeholder: 'TOP SALES OF THE MONTH' },
    { id: 'leftTitle', label: 'Left card name', kind: 'text', group: 'Left' },
    { id: 'leftSubtitle', label: 'Left subline', kind: 'textarea', group: 'Left' },
    { id: 'card', label: 'Left card image', kind: 'image', group: 'Left' },
    { id: 'leftRank', label: 'Left rank', kind: 'text', group: 'Left' },
    { id: 'leftPrice', label: 'Left price', kind: 'currency', group: 'Left' },
    { id: 'leftBadge', label: 'Left source', kind: 'badge', group: 'Left' },
    { id: 'leftCaption', label: 'Left date', kind: 'date', group: 'Left' },
    { id: 'rightTitle', label: 'Right card name', kind: 'text', group: 'Right' },
    { id: 'rightSubtitle', label: 'Right subline', kind: 'textarea', group: 'Right' },
    { id: 'card-right', label: 'Right card image', kind: 'image', group: 'Right' },
    { id: 'rightRank', label: 'Right rank', kind: 'text', group: 'Right' },
    { id: 'rightPrice', label: 'Right price', kind: 'currency', group: 'Right' },
    { id: 'rightBadge', label: 'Right source', kind: 'badge', group: 'Right' },
    { id: 'rightCaption', label: 'Right date', kind: 'date', group: 'Right' },
  ],
  defaults: {
    eyebrow: '',
    leftTitle: 'CHARIZARD',
    leftSubtitle: 'PSA 10 · Japanese EX Dragon\nFrontiers Gold Star #52',
    leftRank: 'TOP 30',
    leftPrice: 180000,
    leftBadge: 'fanatics',
    leftCaption: '2026-08-31',
    rightTitle: 'RAYQUAZA',
    rightSubtitle: 'PSA 10 · Japanese Clash Of\nThe Blue Sky Gold Star #67',
    rightRank: 'TOP 29',
    rightPrice: 180000,
    rightBadge: 'fanatics',
    rightCaption: '2026-08-31',
  },
  derive: (data, formatting) => ({
    leftPriceText: formatCurrency(num(data, 'leftPrice'), formatting),
    rightPriceText: formatCurrency(num(data, 'rightPrice'), formatting),
  }),
  build,
};
