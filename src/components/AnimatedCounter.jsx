import { useState, useEffect, useRef } from 'react';

// True odometer digit - shows old value rolling out while new value rolls in
function OdometerDigit({ digit, previousDigit }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState('up');
  const [oldDigit, setOldDigit] = useState(digit);
  const [newDigit, setNewDigit] = useState(digit);

  useEffect(() => {
    if (previousDigit !== undefined && previousDigit !== null && previousDigit !== digit) {
      const prev = parseInt(previousDigit, 10);
      const curr = parseInt(digit, 10);

      setOldDigit(previousDigit);
      setNewDigit(digit);

      if (!isNaN(prev) && !isNaN(curr)) {
        setDirection(curr > prev ? 'up' : 'down');
      } else {
        setDirection('up');
      }

      setIsAnimating(true);

      const timer = setTimeout(() => {
        setIsAnimating(false);
        setOldDigit(digit);
      }, 400);

      return () => clearTimeout(timer);
    } else {
      setOldDigit(digit);
      setNewDigit(digit);
    }
  }, [digit, previousDigit]);

  // Handle separators (comma, period)
  if (digit === ',' || digit === '.') {
    return (
      <span
        className="inline-block text-center opacity-60"
        style={{ width: '0.35em' }}
      >
        {digit}
      </span>
    );
  }

  return (
    <span
      className="inline-block relative overflow-hidden"
      style={{
        width: '0.62em',
        height: '1.1em',
      }}
    >
      {/* Old digit - rolls out */}
      <span
        className="absolute inset-0 flex items-center justify-center transition-transform duration-400 ease-out"
        style={{
          transform: isAnimating
            ? direction === 'up'
              ? 'translateY(-100%)'
              : 'translateY(100%)'
            : 'translateY(0)',
          opacity: isAnimating ? 0 : 1,
          transitionDuration: '400ms',
        }}
      >
        {oldDigit}
      </span>

      {/* New digit - rolls in */}
      {isAnimating && (
        <span
          className="absolute inset-0 flex items-center justify-center transition-transform duration-400 ease-out"
          style={{
            transform: isAnimating
              ? 'translateY(0)'
              : direction === 'up'
                ? 'translateY(100%)'
                : 'translateY(-100%)',
            transitionDuration: '400ms',
          }}
        >
          {newDigit}
        </span>
      )}
    </span>
  );
}

export default function AnimatedCounter({ value, className = '' }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [prevDisplayValue, setPrevDisplayValue] = useState(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDisplayValue(value);
      return;
    }

    if (value !== displayValue) {
      setPrevDisplayValue(displayValue);
      setDisplayValue(value);
    }
  }, [value]);

  // Format the values
  const formattedValue = (() => {
    if (displayValue === null || displayValue === undefined) return '0';
    return typeof displayValue === 'number' ? displayValue.toLocaleString() : String(displayValue);
  })();

  const prevFormattedValue = (() => {
    if (prevDisplayValue === null || prevDisplayValue === undefined) return null;
    return typeof prevDisplayValue === 'number'
      ? prevDisplayValue.toLocaleString()
      : String(prevDisplayValue);
  })();

  // Create digit arrays
  const digits = formattedValue.split('');
  const prevDigits = prevFormattedValue ? prevFormattedValue.split('') : [];

  // Pad arrays to match length (align from right)
  const maxLen = Math.max(digits.length, prevDigits.length);
  const paddedPrev = [...Array(maxLen - prevDigits.length).fill(null), ...prevDigits];

  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      {digits.map((digit, index) => {
        const prevIndex = index + (paddedPrev.length - digits.length);
        const prevDigit = prevIndex >= 0 ? paddedPrev[prevIndex] : null;

        return (
          <OdometerDigit
            key={`${index}-${digits.length}`}
            digit={digit}
            previousDigit={prevDigit}
          />
        );
      })}
    </span>
  );
}
