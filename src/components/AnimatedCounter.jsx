import { useState, useEffect, useRef, useMemo } from 'react';

// Individual animated digit with rolling effect
function RollingDigit({ digit, previousDigit }) {
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (previousDigit !== undefined && previousDigit !== digit) {
      const prev = parseInt(previousDigit, 10);
      const curr = parseInt(digit, 10);

      if (!isNaN(prev) && !isNaN(curr)) {
        // Determine animation direction
        setAnimationClass(curr > prev ? 'animate-roll-up' : 'animate-roll-down');
      } else {
        setAnimationClass('animate-roll-up');
      }

      // Reset animation after it completes
      const timer = setTimeout(() => setAnimationClass(''), 300);
      return () => clearTimeout(timer);
    }
  }, [digit, previousDigit]);

  // Handle separators (comma, period)
  if (digit === ',' || digit === '.') {
    return (
      <span className="inline-flex items-center justify-center w-[0.35em] opacity-70">
        {digit}
      </span>
    );
  }

  return (
    <span className="inline-block relative overflow-hidden" style={{ width: '0.65em', height: '1.1em' }}>
      <span
        className={`absolute inset-0 flex items-center justify-center ${animationClass}`}
      >
        {digit}
      </span>
    </span>
  );
}

export default function AnimatedCounter({ value, className = '' }) {
  const prevValueRef = useRef(null);
  const [renderKey, setRenderKey] = useState(0);

  // Format the current value
  const formattedValue = useMemo(() => {
    if (value === null || value === undefined) return '0';
    return typeof value === 'number' ? value.toLocaleString() : String(value);
  }, [value]);

  // Get previous formatted value for comparison
  const prevFormattedValue = useMemo(() => {
    if (prevValueRef.current === null || prevValueRef.current === undefined) return null;
    return typeof prevValueRef.current === 'number'
      ? prevValueRef.current.toLocaleString()
      : String(prevValueRef.current);
  }, [prevValueRef.current]);

  // Update prev value after render
  useEffect(() => {
    if (value !== prevValueRef.current) {
      // Small delay to allow animation to use the old value
      const timer = setTimeout(() => {
        prevValueRef.current = value;
        setRenderKey(k => k + 1);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [value]);

  // Create digit arrays, aligned from right
  const digits = formattedValue.split('');
  const prevDigits = prevFormattedValue ? prevFormattedValue.split('') : [];

  // Pad arrays to match length (align from right)
  const maxLen = Math.max(digits.length, prevDigits.length);
  const paddedPrev = [...Array(maxLen - prevDigits.length).fill(undefined), ...prevDigits];

  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      {digits.map((digit, index) => {
        // Calculate the corresponding index in the padded previous array
        const prevIndex = index + (paddedPrev.length - digits.length);
        const prevDigit = prevIndex >= 0 ? paddedPrev[prevIndex] : undefined;

        return (
          <RollingDigit
            key={`${index}-${maxLen}`}
            digit={digit}
            previousDigit={prevDigit}
          />
        );
      })}
    </span>
  );
}
