import { formatCurrency, formatPercent, percentChange } from '@/lib/format';
import { buildComparison } from '../_shared/comparison';
import { num } from '../_shared/layout';
import type { Template } from '../types';

/** Modelled on `same_card_price_comparison_time.jpg`. */
export const saleComparison: Template = {
  id: 'sale-comparison',
  name: 'Sale Comparison',
  description: 'The same card twice — previous sale versus latest sale — with the change between them.',
  reference: 'same_card_price_comparison_time.jpg',
  tags: ['comparison', 'sales', 'price'],
  variants: [],
  fields: [
    { id: 'title', label: 'Card name', kind: 'text', group: 'Header', placeholder: 'LUGIA' },
    { id: 'grade', label: 'Grade', kind: 'text', group: 'Header', placeholder: 'PSA 10' },
    { id: 'set', label: 'Set', kind: 'text', group: 'Header', placeholder: '1st Edition Neo Genesis' },
    { id: 'cardNumber', label: 'Card number', kind: 'text', group: 'Header', placeholder: '#9' },
    { id: 'card', label: 'Left card image', kind: 'image', group: 'Cards' },
    { id: 'card-right', label: 'Right card image', kind: 'image', group: 'Cards' },
    { id: 'leftLabel', label: 'Left label', kind: 'text', group: 'Stats' },
    { id: 'leftPrice', label: 'Previous sale', kind: 'currency', group: 'Stats' },
    { id: 'leftBadge', label: 'Left source', kind: 'badge', group: 'Stats' },
    { id: 'leftCaptionDate', label: 'Left date', kind: 'date', group: 'Stats' },
    { id: 'changeLabel', label: 'Middle label', kind: 'text', group: 'Stats' },
    { id: 'changeText', label: 'Middle value', kind: 'text', group: 'Stats', derived: true },
    { id: 'rightLabel', label: 'Right label', kind: 'text', group: 'Stats' },
    { id: 'rightPrice', label: 'Latest sale', kind: 'currency', group: 'Stats' },
    { id: 'rightBadge', label: 'Right source', kind: 'badge', group: 'Stats' },
    { id: 'rightCaptionDate', label: 'Right date', kind: 'date', group: 'Stats' },
  ],
  defaults: {
    title: 'LUGIA',
    grade: 'PSA 10',
    set: '1st Edition Neo Genesis',
    cardNumber: '#9',
    leftLabel: 'PREVIOUS SALE',
    changeLabel: 'PRICE CHANGE',
    rightLabel: 'LATEST SALE',
    leftPrice: 205794,
    rightPrice: 360000,
    leftBadge: 'alt',
    rightBadge: 'fanatics',
    leftCaptionDate: '2026-06-04',
    rightCaptionDate: '2026-08-31',
  },
  derive: (data, formatting) => {
    const left = num(data, 'leftPrice');
    const right = num(data, 'rightPrice');
    return {
      leftPriceText: formatCurrency(left, formatting),
      rightPriceText: formatCurrency(right, formatting),
      changeText: `${percentChange(left, right) >= 0 ? '▲ ' : '▼ '}${formatPercent(percentChange(left, right), formatting)}`,
    };
  },
  nodeFields: {
    headline: 'title',
    'subtitle-grade': 'grade',
    'subtitle-set': 'set',
    'subtitle-number': 'cardNumber',
    'stat-left-label': 'leftLabel',
    'stat-left-value': 'leftPriceText',
    'stat-change-label': 'changeLabel',
    'stat-change-value': 'changeText',
    'stat-right-label': 'rightLabel',
    'stat-right-value': 'rightPriceText',
  },
  build: (ctx) =>
    buildComparison(ctx, {
      header: 'subline',
      leftLabelDefault: 'PREVIOUS SALE',
      changeLabelDefault: 'PRICE CHANGE',
      rightLabelDefault: 'LATEST SALE',
      changeMode: 'change',
    }),
};
