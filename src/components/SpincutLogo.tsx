import { useId } from 'react';

interface SpincutLogoProps {
  size?: 'sm' | 'md' | 'lg'
}

export default function SpincutLogo({ size = 'md' }: SpincutLogoProps) {
  const uid = useId().replace(/:/g, '');

  // Scale factors
  const scale   = size === 'sm' ? 0.55 : size === 'md' ? 0.78 : 1.1;
  const iconW   = Math.round(72 * scale);
  const iconH   = Math.round(80 * scale);
  const titlePx = size === 'sm' ? 15 : size === 'md' ? 21 : 30;
  const gap     = size === 'lg' ? 'gap-4' : 'gap-3';

  const g = (id: string) => `${id}-${uid}`;

  return (
    <div className={`flex items-center ${gap}`}>
      {/* ── S icon ── */}
      <svg
        width={iconW}
        height={iconH}
        viewBox="0 0 72 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gold gradient — bottom-left → top-right */}
          <linearGradient id={g('gld')} x1="6" y1="70" x2="66" y2="10" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#3d1800"/>
            <stop offset="30%"  stopColor="#a85508"/>
            <stop offset="60%"  stopColor="#e8880e"/>
            <stop offset="85%"  stopColor="#f5b830"/>
            <stop offset="100%" stopColor="#ffe080"/>
          </linearGradient>

          {/* Chrome top lobe — upper-right is bright */}
          <linearGradient id={g('ct')} x1="58" y1="6" x2="14" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#ffffff"/>
            <stop offset="20%"  stopColor="#e0e0e0"/>
            <stop offset="55%"  stopColor="#9a9a9a"/>
            <stop offset="100%" stopColor="#3a3a3a"/>
          </linearGradient>

          {/* Chrome bottom lobe — lower-left is darker */}
          <linearGradient id={g('cb')} x1="14" y1="42" x2="60" y2="76" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#cccccc"/>
            <stop offset="45%"  stopColor="#686868"/>
            <stop offset="100%" stopColor="#1a1a1a"/>
          </linearGradient>

          {/* Outer face of top lobe (slightly lighter) */}
          <linearGradient id={g('co')} x1="60" y1="8" x2="30" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
          </linearGradient>
        </defs>

        {/* ── Top lobe of S ── */}
        {/* Main body */}
        <path
          d="M 46 8 C 56 8 64 14 64 24 C 64 34 56 39 44 39 L 28 39"
          stroke={`url(#${g('ct')})`}
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />
        {/* Inner edge darker line */}
        <path
          d="M 46 8 C 56 8 64 14 64 24 C 64 34 56 39 44 39 L 28 39"
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          transform="translate(3,3)"
        />
        {/* Outer highlight */}
        <path
          d="M 48 9 C 57 9 63 14 63 24"
          stroke={`url(#${g('co')})`}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* ── Bottom lobe of S ── */}
        <path
          d="M 44 41 L 28 41 C 16 41 8 46 8 56 C 8 66 14 74 26 74"
          stroke={`url(#${g('cb')})`}
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />
        {/* Inner edge */}
        <path
          d="M 28 41 C 16 41 8 46 8 56 C 8 66 14 74 26 74"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          transform="translate(-3,3)"
        />

        {/* ── Gold diagonal swoosh ── */}
        {/* Main swoosh */}
        <path
          d="M 10 68 Q 22 58 36 44 Q 50 30 62 16"
          stroke={`url(#${g('gld')})`}
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />
        {/* Swoosh bright edge */}
        <path
          d="M 13 70 Q 25 60 39 46 Q 52 33 64 19"
          stroke="rgba(255,210,80,0.30)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {/* Swoosh dark edge for depth */}
        <path
          d="M 8 66 Q 20 56 34 42 Q 48 28 60 14"
          stroke="rgba(80,30,0,0.45)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* ── Text block ── */}
      <div className="flex flex-col leading-none">
        {/* SPINCUT — chrome metallic effect via CSS gradient */}
        <span
          className="font-black tracking-[0.13em] select-none"
          style={{
            fontSize: titlePx,
            background: 'linear-gradient(180deg, #ffffff 0%, #d8d8d8 35%, #a0a0a0 70%, #606060 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          SPINCUT
        </span>

        {/* — OUTILS CNC — */}
        <div
          className="flex items-center gap-1 mt-0.5"
          style={{ fontSize: size === 'lg' ? 11 : 9 }}
        >
          <span style={{ color: '#c4780a' }}>—</span>
          <span
            className="tracking-[0.25em] font-semibold"
            style={{ color: '#888888' }}
          >
            OUTILS CNC
          </span>
          <span style={{ color: '#c4780a' }}>—</span>
        </div>

        {/* Tagline — only on large */}
        {size === 'lg' && (
          <p
            className="tracking-[0.13em] mt-1.5 font-medium"
            style={{ fontSize: 9.5, color: '#c4780a' }}
          >
            PRÉCISION · PERFORMANCE · INNOVATION
          </p>
        )}
      </div>
    </div>
  );
}
