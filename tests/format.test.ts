import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FORMATTING,
  daysBetween,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  parseLooseNumber,
  percentChange,
  spanLabel,
} from '@/lib/format';

const eu = { ...DEFAULT_FORMATTING, currency: '€', thousandsSeparator: '.' as const, decimalSeparator: ',' as const };

describe('formatNumber', () => {
  it('groups thousands', () => {
    expect(formatNumber(1725, DEFAULT_FORMATTING)).toBe('1,725');
    expect(formatNumber(360000, DEFAULT_FORMATTING)).toBe('360,000');
    expect(formatNumber(82868, DEFAULT_FORMATTING)).toBe('82,868');
  });

  it('honours the Director-selectable separators', () => {
    expect(formatNumber(1725.5, eu, 2)).toBe('1.725,50');
  });

  it('keeps negatives readable', () => {
    expect(formatNumber(-1200, DEFAULT_FORMATTING)).toBe('-1,200');
  });
});

describe('formatCurrency', () => {
  it('prefixes the chosen symbol', () => {
    expect(formatCurrency(2760, DEFAULT_FORMATTING)).toBe('$2,760');
    expect(formatCurrency(2760, eu)).toBe('€2.760');
  });
});

describe('percentChange / formatPercent', () => {
  it('matches the reference graphics', () => {
    expect(percentChange(2760, 3500)).toBeCloseTo(26.81, 2);
    expect(percentChange(1725, 850)).toBeCloseTo(-50.72, 2);
    expect(formatPercent(percentChange(2760, 3500), DEFAULT_FORMATTING)).toBe('26.81%');
  });

  it('never divides by zero', () => {
    expect(percentChange(0, 100)).toBe(0);
  });
});

describe('dates', () => {
  it('formats long, short and numeric', () => {
    expect(formatDate('2026-08-28', DEFAULT_FORMATTING)).toBe('AUGUST 28, 2026');
    expect(formatDate('2026-08-28', { ...DEFAULT_FORMATTING, dateStyle: 'short' })).toBe('AUG 28, 2026');
    expect(formatDate('2026-08-28', { ...DEFAULT_FORMATTING, dateStyle: 'numeric' })).toBe('08/28/2026');
  });

  it('counts the span between two dates', () => {
    expect(daysBetween('2026-08-28', '2026-09-04')).toBe(7);
    expect(spanLabel(7)).toBe('7-DAY');
    expect(spanLabel(196)).toBe('7-MONTH');
    expect(spanLabel(730)).toBe('2-YEAR');
  });
});

describe('parseLooseNumber', () => {
  it('reads what a user pastes', () => {
    expect(parseLooseNumber('$1,725', DEFAULT_FORMATTING)).toBe(1725);
    expect(parseLooseNumber('€1.725,50', eu)).toBe(1725.5);
  });
});
