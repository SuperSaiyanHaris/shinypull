import { motion } from 'framer-motion';

/**
 * Reveal — drop this around any block of content for a scroll-triggered fade-in.
 * Uses framer-motion's `whileInView` so it only animates the first time the
 * element enters the viewport. Honors prefers-reduced-motion automatically.
 *
 * Props:
 *   delay: seconds to wait after entering viewport
 *   y: vertical offset to slide from (default 16px)
 *   as: element tag (default 'div')
 */
export default function Reveal({
  children,
  delay = 0,
  y = 16,
  as = 'div',
  className,
  ...rest
}) {
  const MotionTag = motion[as] || motion.div;
  return (
    <MotionTag
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
