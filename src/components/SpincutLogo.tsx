interface SpincutLogoProps {
  size?: 'sm' | 'md' | 'lg'
}

export default function SpincutLogo({ size = 'md' }: SpincutLogoProps) {
  const iconW = size === 'sm' ? 26 : size === 'md' ? 36 : 50
  const iconH = size === 'sm' ? 30 : size === 'md' ? 42 : 58
  const titleClass = size === 'sm' ? 'text-base' : size === 'md' ? 'text-xl' : 'text-3xl'
  const subtitleClass = size === 'lg' ? 'text-[11px]' : 'text-[9px]'
  const gapClass = size === 'lg' ? 'gap-4' : 'gap-2.5'

  return (
    <div className={`flex items-center ${gapClass}`}>
      {/* S icon — chrome + gold swoosh matching real SPINCUT logo */}
      <svg width={iconW} height={iconH} viewBox="0 0 42 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="spGold" x1="4" y1="44" x2="38" y2="6" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#5c2600"/>
            <stop offset="35%"  stopColor="#c4650a"/>
            <stop offset="70%"  stopColor="#f0a020"/>
            <stop offset="100%" stopColor="#ffd060"/>
          </linearGradient>
          <linearGradient id="spTopArc" x1="30" y1="4" x2="8" y2="26" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#f4f4f4"/>
            <stop offset="30%"  stopColor="#c8c8c8"/>
            <stop offset="70%"  stopColor="#808080"/>
            <stop offset="100%" stopColor="#404040"/>
          </linearGradient>
          <linearGradient id="spBotArc" x1="12" y1="24" x2="34" y2="46" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#d0d0d0"/>
            <stop offset="50%"  stopColor="#707070"/>
            <stop offset="100%" stopColor="#282828"/>
          </linearGradient>
        </defs>

        {/* Upper lobe of S (chrome) */}
        <path
          d="M 29 5 C 37 5 41 10 41 17 C 41 24 35 27 26 27 L 16 27"
          stroke="url(#spTopArc)" strokeWidth="6" strokeLinecap="round" fill="none"
        />
        {/* Lower lobe of S (chrome) */}
        <path
          d="M 26 27 L 16 27 C 7 27 1 30 1 37 C 1 44 6 49 14 49"
          stroke="url(#spBotArc)" strokeWidth="6" strokeLinecap="round" fill="none"
        />
        {/* Chrome highlight — upper lobe */}
        <path
          d="M 31 6 C 37 7.5 40 12 40 17"
          stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" fill="none"
        />
        {/* Gold diagonal swoosh */}
        <path
          d="M 4 44 Q 13 36 21 27 Q 30 19 38 10"
          stroke="url(#spGold)" strokeWidth="4" strokeLinecap="round" fill="none"
        />
        {/* Gold shimmer highlight */}
        <path
          d="M 8 46 Q 17 38 25 29 Q 33 21 40 13"
          stroke="rgba(255,185,40,0.22)" strokeWidth="2.5" strokeLinecap="round" fill="none"
        />
      </svg>

      {/* Text block */}
      <div className="flex flex-col leading-none">
        <span
          className={`font-black text-white ${titleClass}`}
          style={{ letterSpacing: '0.14em', fontStretch: 'condensed' }}
        >
          SPINCUT
        </span>
        <div className={`flex items-center gap-1 mt-0.5 ${subtitleClass}`}>
          <span style={{ color: '#d4780f', opacity: 0.6 }}>—</span>
          <span className="tracking-[0.22em] font-medium" style={{ color: '#888' }}>OUTILS CNC</span>
          <span style={{ color: '#d4780f', opacity: 0.6 }}>—</span>
        </div>
        {size === 'lg' && (
          <p className="text-[9px] tracking-[0.14em] mt-1.5" style={{ color: '#d4780f' }}>
            PRÉCISION · PERFORMANCE · INNOVATION
          </p>
        )}
      </div>
    </div>
  )
}
