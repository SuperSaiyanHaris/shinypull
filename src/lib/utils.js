export function formatNumber(num) {
  if (num === null || num === undefined) return '-';
  if (Math.abs(num) >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
  if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (Math.abs(num) >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}
