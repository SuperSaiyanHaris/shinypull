import { NUMBER_THRESHOLDS } from './constants';

export function formatNumber(num) {
  if (num === null || num === undefined) return '-';
  if (Math.abs(num) >= NUMBER_THRESHOLDS.BILLION) return (num / NUMBER_THRESHOLDS.BILLION).toFixed(2) + 'B';
  if (Math.abs(num) >= NUMBER_THRESHOLDS.MILLION) return (num / NUMBER_THRESHOLDS.MILLION).toFixed(1) + 'M';
  if (Math.abs(num) >= NUMBER_THRESHOLDS.THOUSAND) return (num / NUMBER_THRESHOLDS.THOUSAND).toFixed(1) + 'K';
  return num.toLocaleString();
}

export function formatEngagementRate(rate) {
  if (rate === null || rate === undefined || rate === 0) return '—';
  if (rate >= 100) return Math.round(rate) + '%';
  if (rate >= 10) return rate.toFixed(1) + '%';
  return rate.toFixed(2) + '%';
}
