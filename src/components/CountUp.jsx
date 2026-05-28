import { useEffect, useRef, useState } from 'react';
import { animate, useInView } from 'framer-motion';
import { formatNumber } from '../lib/utils';

/**
 * CountUp — animates a number from 0 (or `from`) to `value` once it enters the viewport.
 * Used everywhere a stat number is displayed to give the site a "data is alive" feel.
 *
 * Props:
 *   value: the final number
 *   from: starting number (default 0)
 *   duration: seconds (default 1.4)
 *   format: 'number' (default, uses formatNumber with K/M/B), 'comma' (plain comma-separated), 'percent', or a custom fn
 *   prefix / suffix: strings to wrap the formatted number
 *   className: passed through
 */
export default function CountUp({
  value,
  from = 0,
  duration = 1.4,
  format = 'number',
  prefix = '',
  suffix = '',
  className = '',
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const [display, setDisplay] = useState(from);

  useEffect(() => {
    if (!inView) return;
    if (typeof value !== 'number' || !isFinite(value)) {
      setDisplay(value);
      return;
    }
    const controls = animate(from, value, {
      duration,
      ease: [0.16, 1, 0.3, 1], // ease-out-expo feel
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
  }, [inView, value, from, duration]);

  let formatted;
  if (typeof value !== 'number' || !isFinite(value)) {
    formatted = String(value ?? '—');
  } else if (typeof format === 'function') {
    formatted = format(display);
  } else if (format === 'comma') {
    formatted = Math.round(display).toLocaleString('en-US');
  } else if (format === 'percent') {
    formatted = `${display.toFixed(1)}%`;
  } else {
    formatted = formatNumber(Math.round(display));
  }

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
