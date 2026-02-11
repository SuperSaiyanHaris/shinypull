/**
 * Instagram Icon Component
 * Adapts to text color like other Lucide icons
 * Use text-purple-600 or similar for colored version
 * Use text-white for white version on colored backgrounds
 */
export default function InstagramIcon({ className = 'w-5 h-5' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5"
      />
      <circle
        cx="12"
        cy="12"
        r="4.5"
      />
      <circle
        cx="18"
        cy="6"
        r="1.5"
        fill="currentColor"
      />
    </svg>
  );
}
