/**
 * Custom Kick platform icon (green "K" logo)
 * Kick doesn't have a lucide-react icon, so we use a custom SVG
 */
export default function KickIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.2 2.4h5.4v7.2l2.7-3.6h6L10.5 12l4.8 6h-6l-2.7-3.6v7.2H1.2V2.4zm16.2 0H24v19.2h-6.6v-7.2h6V9.6h-6V2.4z" />
    </svg>
  );
}
