import { useMemo } from 'react';

/**
 * Sparkline — inline mini area chart for rankings table.
 * Pure SVG, no Recharts overhead. Built to render hundreds of these on a single page.
 *
 * Props:
 *   data: number[] — y-values, evenly spaced on the x-axis
 *   trend: 'up' | 'down' | 'flat' — colors the line + fill
 *   width / height: dimensions in pixels
 *   strokeWidth: line thickness
 */
export default function Sparkline({
  data = [],
  trend,
  width = 80,
  height = 24,
  strokeWidth = 1.5,
  className = '',
  fluid = false, // When true, SVG fills container width; viewBox uses `width` as internal coord space
}) {
  const path = useMemo(() => {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const xStep = width / (data.length - 1);
    const points = data.map((v, i) => {
      const x = i * xStep;
      const y = height - ((v - min) / range) * (height - strokeWidth) - strokeWidth / 2;
      return [x, y];
    });
    const linePath = points.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ');
    const fillPath = `${linePath} L${width},${height} L0,${height} Z`;
    return { linePath, fillPath };
  }, [data, width, height, strokeWidth]);

  // Auto-detect trend if not provided
  const resolvedTrend = useMemo(() => {
    if (trend) return trend;
    if (!data || data.length < 2) return 'flat';
    const first = data[0];
    const last = data[data.length - 1];
    const delta = (last - first) / (first || 1);
    if (delta > 0.001) return 'up';
    if (delta < -0.001) return 'down';
    return 'flat';
  }, [data, trend]);

  if (!path) {
    return (
      <div
        className={`${className} flex items-center justify-center text-gray-700 text-[10px]`}
        style={{ width, height }}
      >
        —
      </div>
    );
  }

  const colors = {
    up:   { stroke: '#34d399', fill: 'rgba(52, 211, 153, 0.18)' },
    down: { stroke: '#f87171', fill: 'rgba(248, 113, 113, 0.18)' },
    flat: { stroke: '#9ca3af', fill: 'rgba(156, 163, 175, 0.12)' },
  };
  const { stroke, fill } = colors[resolvedTrend];

  return (
    <svg
      width={fluid ? '100%' : width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={fluid ? 'none' : 'xMidYMid meet'}
      className={`${className} ${fluid ? 'block' : 'overflow-visible'}`}
      aria-hidden="true"
    >
      <path d={path.fillPath} fill={fill} />
      <path
        d={path.linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
