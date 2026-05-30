/**
 * Rumble logo — the "R play" mark, simplified for icon use.
 * Forwards style + props so callers can set color via inline style.
 * Same pattern as KickIcon, BlueskyIcon, TikTokIcon, MastodonIcon.
 */
export default function RumbleIcon({ className, style, ...rest }) {
  return (
    <svg
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...rest}
    >
      <path d="M22.435 9.299c-.371-.605-.847-1.137-1.395-1.581L9.842 1.235a3.84 3.84 0 0 0-3.835-.022 3.84 3.84 0 0 0-1.926 3.32V17.46a3.84 3.84 0 0 0 1.926 3.32 3.838 3.838 0 0 0 3.835-.023l11.198-6.482a3.84 3.84 0 0 0 1.929-3.318 3.86 3.86 0 0 0-.534-1.659zM15.66 12.49l-6.05 3.529a.957.957 0 0 1-.957.005.96.96 0 0 1-.482-.83V8.157a.96.96 0 0 1 .482-.831.957.957 0 0 1 .957.005l6.05 3.529a.96.96 0 0 1 .477.829.957.957 0 0 1-.477.802z" />
    </svg>
  );
}
