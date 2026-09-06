import { formatCurrency, formatPercent, percentChange } from '@/lib/format';
import { buildComparison } from '../_shared/comparison';
import { num, str } from '../_shared/layout';
import type { Template } from '../types';

/** Modelled on `grading_company_price_comparisons.jpg`. */
export const gradeComparison: Template = {
  id: 'grade-comparison',
  name: 'Grade Comparison',
  description: 'The same card in two grades side by side, with population counts and both sale prices.',
  reference: 'grading_company_price_comparisons.jpg',
  tags: ['comparison', 'grading', 'population'],
  variants: [],
  fields: [
    { id: 'title', label: 'Card name', kind: 'text', group: 'Header', placeholder: 'PIKACHU' },
    { id: 'leftCaption', label: 'Left caption', kind: 'text', group: 'Header', placeholder: 'CGC 10 PRISTINE POP: 46' },
    { id: 'rightCaption', label: 'Right caption', kind: 'text', group: 'Header', placeholder: 'PSA 10 GEM MT POP: 2,069' },
    { id: 'card', label: 'Left card image', kind: 'image', group: 'Cards' },
    { id: 'card-right', label: 'Right card image', kind: 'image', group: 'Cards' },
    { id: 'leftLabel', label: 'Left label', kind: 'text', group: 'Stats' },
    { id: 'leftPrice', label: 'Left price', kind: 'currency', group: 'Stats' },
    { id: 'leftBadge', label: 'Left source', kind: 'badge', group: 'Stats' },
    { id: 'leftCaptionDate', label: 'Left date', kind: 'date', group: 'Stats' },
    { id: 'changeLabel', label: 'Middle label', kind: 'text', group: 'Stats' },
    { id: 'changeText', label: 'Middle value', kind: 'text', group: 'Stats', derived: true },
    { id: 'rightLabel', label: 'Right label', kind: 'text', group: 'Stats' },
    { id: 'rightPrice', label: 'Right price', kind: 'currency', group: 'Stats' },
    { id: 'rightBadge', label: 'Right source', kind: 'badge', group: 'Stats' },
    { id: 'rightCaptionDate', label: 'Right date', kind: 'date', group: 'Stats' },
  ],
  defaults: {
    title: 'PIKACHU',
    leftCaption: 'CGC 10 PRISTINE POP: 46',
    rightCaption: 'PSA 10 GEM MT POP: 2,069',
    leftLabel: 'LATEST SALE',
    changeLabel: 'PRICE DIFFERENCE',
    rightLabel: 'LATEST SALE',
    leftPrice: 5300,
    rightPrice: 11200,
    leftBadge: 'ebay',
    rightBadge: 'fanatics',
    leftCaptionDate: '2026-08-06',
    rightCaptionDate: '2026-06-12',
  },
  derive: (data, formatting) => {
    const left = num(data, 'leftPrice');
    const right = num(data, 'rightPrice');
    const diff = percentChange(left, right);
    return {
      leftPriceText: formatCurrency(left, formatting),
      rightPriceText: formatCurrency(right, formatting),
      changeText: `${diff >= 0 ? '+' : '−'}${formatPercent(Math.abs(diff), formatting, 0)}`,
    };
  },
  build: (ctx) =>
    buildComparison(ctx, {
      header: 'captions',
      leftLabelDefault: str(ctx.data, 'leftLabel', 'LATEST SALE'),
      changeLabelDefault: 'PRICE DIFFERENCE',
      rightLabelDefault: str(ctx.data, 'rightLabel', 'LATEST SALE'),
      changeMode: 'difference',
    }),
};
