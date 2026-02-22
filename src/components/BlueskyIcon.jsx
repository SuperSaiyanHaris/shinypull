/**
 * Custom Bluesky platform icon (butterfly)
 * Bluesky doesn't have a lucide-react icon, so we use a custom SVG
 */
export default function BlueskyIcon({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Upper wings */}
      <path d="M12 11C10 6 5 3 3 6C1 9 3 12 7 12C9.5 12 11.5 11 12 11C12.5 11 14.5 12 17 12C21 12 23 9 21 6C19 3 14 6 12 11Z" />
      {/* Lower wings */}
      <path d="M12 11C10.5 14 9 18 10.5 20C11.5 21 12 19 12 17" />
      <path d="M12 11C13.5 14 15 18 13.5 20C12.5 21 12 19 12 17" />
    </svg>
  );
}
