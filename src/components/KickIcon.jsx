/**
 * Custom Kick platform icon
 * Kick doesn't have a lucide-react icon, so we use a custom SVG based on their official logo
 */
export default function KickIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M45 30h25v50l20-25h30l-28 35 28 40h-30l-20-25v50H45V30z"/>
      <path d="M135 30h30v30h-30V30z"/>
      <path d="M135 75h30v95h-30V75z"/>
    </svg>
  );
}
