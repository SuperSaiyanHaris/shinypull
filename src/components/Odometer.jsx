import { useState, useEffect, useRef } from 'react';

// Single digit column that scrolls through 0-9
function OdometerDigit({ digit, duration = 500 }) {
  const [currentDigit, setCurrentDigit] = useState(digit);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevDigit = useRef(digit);

  useEffect(() => {
    if (digit !== prevDigit.current) {
      setIsAnimating(true);

      // Animate to new digit
      const timeout = setTimeout(() => {
        setCurrentDigit(digit);
        setIsAnimating(false);
        prevDigit.current = digit;
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [digit, duration]);

  const numericDigit = parseInt(digit, 10);
  const prevNumericDigit = parseInt(prevDigit.current, 10);

  // Calculate direction and steps
  const goingUp = numericDigit > prevNumericDigit ||
    (prevNumericDigit === 9 && numericDigit === 0);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: '0.65em',
        height: '1.2em',
      }}
    >
      <div
        className="absolute inset-0 flex flex-col items-center transition-transform ease-out"
        style={{
          transform: `translateY(${-currentDigit * 1.2}em)`,
          transitionDuration: `${duration}ms`,
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <span
            key={d}
            className="flex items-center justify-center"
            style={{ height: '1.2em', lineHeight: '1.2em' }}
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

// Comma separator
function OdometerSeparator() {
  return (
    <span
      className="inline-block text-center opacity-60"
      style={{ width: '0.3em' }}
    >
      ,
    </span>
  );
}

export default function Odometer({ value, duration = 500, className = '' }) {
  // Format number and split into digits
  const formattedValue = value.toLocaleString('en-US');
  const characters = formattedValue.split('');

  return (
    <div className={`inline-flex items-center font-mono ${className}`}>
      {characters.map((char, index) => {
        if (char === ',') {
          return <OdometerSeparator key={`sep-${index}`} />;
        }
        return (
          <OdometerDigit
            key={`digit-${index}-${characters.length}`}
            digit={char}
            duration={duration}
          />
        );
      })}
    </div>
  );
}
