/**
 * Instagram Icon Component
 * Official Instagram gradient brand colors
 */
export default function InstagramIcon({ className = 'w-5 h-5' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient
          id="instagram-gradient"
          cx="30%"
          cy="110%"
          r="150%"
          fx="30%"
          fy="110%"
        >
          <stop offset="0%" stopColor="#FFD521" />
          <stop offset="5%" stopColor="#FD5949" />
          <stop offset="30%" stopColor="#D62976" />
          <stop offset="65%" stopColor="#962FBF" />
          <stop offset="100%" stopColor="#4F5BD5" />
        </radialGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5"
        stroke="url(#instagram-gradient)"
        strokeWidth="2"
        fill="none"
      />
      <circle
        cx="12"
        cy="12"
        r="4.5"
        stroke="url(#instagram-gradient)"
        strokeWidth="2"
        fill="none"
      />
      <circle
        cx="18"
        cy="6"
        r="1.5"
        fill="url(#instagram-gradient)"
      />
    </svg>
  );
}
