import type { FormattingSettings } from './types';

export const DEFAULT_FORMATTING: FormattingSettings = {
  currency: '$',
  thousandsSeparator: ',',
  decimalSeparator: '.',
  dateStyle: 'long',
};

const MONTHS_LONG = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];
const MONTHS_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** Groups the integer part; keeps the fraction if `decimals > 0`. */
export function formatNumber(
  value: number,
  fmt: FormattingSettings,
  decimals = 0,
): string {
  if (!Number.isFinite(value)) return '—';
  const negative = value < 0;
  const fixed = Math.abs(value).toFixed(decimals);
  const [intPart, fracPart] = fixed.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, fmt.thousandsSeparator);
  const out = fracPart ? `${grouped}${fmt.decimalSeparator}${fracPart}` : grouped;
  return negative ? `-${out}` : out;
}

export function formatCurrency(value: number, fmt: FormattingSettings, decimals = 0): string {
  return `${fmt.currency}${formatNumber(value, fmt, decimals)}`;
}

/** Axis ticks use the same separators but never a currency symbol. */
export function formatTick(value: number, fmt: FormattingSettings): string {
  const decimals = Math.abs(value) < 10 && !Number.isInteger(value) ? 2 : 0;
  return formatNumber(value, fmt, decimals);
}

export function formatPercent(value: number, fmt: FormattingSettings, decimals = 2): string {
  return `${formatNumber(Math.abs(value), fmt, decimals)}%`;
}

/** Accepts `YYYY-MM-DD` (preferred) and anything `Date` can parse. */
export function parseDate(input: string): Date | null {
  if (!input) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(input: string, fmt: FormattingSettings): string {
  const d = parseDate(input);
  if (!d) return input.toUpperCase();
  const day = d.getDate();
  const year = d.getFullYear();
  switch (fmt.dateStyle) {
    case 'short':
      return `${MONTHS_SHORT[d.getMonth()]} ${day}, ${year}`;
    case 'numeric':
      return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
    default:
      return `${MONTHS_LONG[d.getMonth()]} ${day}, ${year}`;
  }
}

export function monthShort(monthIndex: number): string {
  return MONTHS_SHORT[((monthIndex % 12) + 12) % 12];
}

/** Whole days between two dates, used for the "N-DAY CHANGE" label. */
export function daysBetween(a: string, b: string): number | null {
  const da = parseDate(a);
  const db = parseDate(b);
  if (!da || !db) return null;
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

/** Human span for a stat label: 7-DAY, 30-DAY, 6-MONTH, 1-YEAR… */
export function spanLabel(days: number): string {
  const d = Math.abs(days);
  if (d <= 0) return 'CHANGE';
  if (d < 45) return `${d}-DAY`;
  const months = Math.round(d / 30);
  if (months < 18) return `${months}-MONTH`;
  const years = Math.round(d / 365);
  return `${years}-YEAR`;
}

export function percentChange(from: number, to: number): number {
  if (!Number.isFinite(from) || from === 0) return 0;
  return ((to - from) / Math.abs(from)) * 100;
}

/** Parses "1,725", "$1.725", "1 725.50" into a number. */
export function parseLooseNumber(input: string, fmt: FormattingSettings): number {
  const cleaned = input
    .replace(/[^\d.,\-\s]/g, '')
    .replace(/\s/g, '')
    .split('')
    .filter((c) => c !== fmt.thousandsSeparator)
    .join('')
    .replace(fmt.decimalSeparator, '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}
