// Vercel Edge Function — generates the Open Graph preview image
// Served at /api/og — referenced by og:image and twitter:image in index.html
// Runs on Edge Runtime for fast global response times

import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default function handler() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 52%, #0f172a 100%)',
          fontFamily: 'sans-serif',
          padding: '60px',
        }}
      >
        {/* Logo row: icon box + ShinyPull name */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
          {/* Indigo icon box with bar chart */}
          <div
            style={{
              width: '88px',
              height: '88px',
              backgroundColor: '#4f46e5',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: '16px',
              paddingLeft: '16px',
              paddingRight: '16px',
              marginRight: '28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
              <div
                style={{
                  width: '15px',
                  height: '28px',
                  backgroundColor: 'rgba(255,255,255,0.55)',
                  borderRadius: '3px 3px 0 0',
                }}
              />
              <div
                style={{
                  width: '15px',
                  height: '48px',
                  backgroundColor: 'white',
                  borderRadius: '3px 3px 0 0',
                }}
              />
              <div
                style={{
                  width: '15px',
                  height: '36px',
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  borderRadius: '3px 3px 0 0',
                }}
              />
            </div>
          </div>

          {/* Brand name */}
          <div
            style={{
              display: 'flex',
              fontSize: '88px',
              fontWeight: '800',
              letterSpacing: '-3px',
            }}
          >
            <span style={{ color: '#f1f5f9' }}>Shiny</span>
            <span style={{ color: '#6366f1' }}>Pull</span>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            color: '#94a3b8',
            fontSize: '30px',
            textAlign: 'center',
            maxWidth: '860px',
            lineHeight: 1.5,
            marginBottom: '52px',
            fontWeight: '400',
          }}
        >
          Creator analytics for YouTube, TikTok, Twitch, Kick, and Bluesky.
        </div>

        {/* Platform pills */}
        <div style={{ display: 'flex', gap: '14px' }}>
          {['YouTube', 'TikTok', 'Twitch', 'Kick', 'Bluesky'].map((name, i) => (
            <div
              key={i}
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                color: '#cbd5e1',
                padding: '10px 24px',
                borderRadius: '999px',
                fontSize: '20px',
                fontWeight: '500',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Domain */}
        <div
          style={{
            color: '#475569',
            fontSize: '22px',
            marginTop: '52px',
            fontWeight: '500',
            letterSpacing: '0.5px',
          }}
        >
          shinypull.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
