import { useState, useEffect, useRef } from 'react';

// Individual animated digit with rolling effect
function RollingDigit({ digit, previousDigit }) {
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (previousDigit !== undefined && previousDigit !== null && previousDigit !== digit) {
      const prev = parseInt(previousDigit, 10);
      const curr = parseInt(digit, 10);

      if (!isNaN(prev) && !isNaN(curr)) {
        setAnimationClass(curr > prev ? 'animate-roll-up' : 'animate-roll-down');
      } else {
        setAnimationClass('animate-roll-up');
      }

      const timer = setTimeout(() => setAnimationClass(''), 300);
      return () => clearTimeout(timer);
    }
  }, [digit, previousDigit]);

  // Handle separators (comma, period)
  if (digit === ',' || digit === '.') {
    return (
      <span className="inline-block w-[0.3em] text-center opacity-70">
        {digit}
      </span>
    );
  }

  return (
    <span
      className="inline-block relative overflow-hidden"
      style={{ width: '0.65em', height: '1.15em', lineHeight: '1.15em' }}
    >
      <span className={`block ${animationClass}`}>
        {digit}
      </span>
    </span>
  );
}

export default function AnimatedCounter({ value, className = '' }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(null);

  // Format the value
  const formattedValue = (() => {
    if (displayValue === null || displayValue === undefined) return '0';
    return typeof displayValue === 'number' ? displayValue.toLocaleString() : String(displayValue);
  })();

  // Get previous formatted value
  const prevFormattedValue = (() => {
    if (prevValueRef.current === null || prevValueRef.current === undefined) return null;
    return typeof prevValueRef.current === 'number'
      ? prevValueRef.current.toLocaleString()
      : String(prevValueRef.current);
  })();

  // Update when value changes
  useEffect(() => {
    if (value !== displayValue) {
      prevValueRef.current = displayValue;
      setDisplayValue(value);
    }
  }, [value]);

  // Create digit arrays
  const digits = formattedValue.split('');
  const prevDigits = prevFormattedValue ? prevFormattedValue.split('') : [];

  // Pad arrays to match length (align from right)
  const maxLen = Math.max(digits.length, prevDigits.length);
  const paddedPrev = [...Array(maxLen - prevDigits.length).fill(null), ...prevDigits];

  return (
    <span className={`inline-flex items-baseline ${className}`}>
      {digits.map((digit, index) => {
        const prevIndex = index + (paddedPrev.length - digits.length);
        const prevDigit = prevIndex >= 0 ? paddedPrev[prevIndex] : null;

        return (
          <RollingDigit
            key={`${index}-${digits.length}`}
            digit={digit}
            previousDigit={prevDigit}
          />
        );
      })}
    </span>
  );
}
