interface SpincutLogoProps {
  size?: 'sm' | 'md' | 'lg'
}

export default function SpincutLogo({ size = 'md' }: SpincutLogoProps) {
  const iconSize = size === 'sm' ? 32 : size === 'md' ? 44 : 56
  const titleSize = size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : 'text-3xl'
  const subtitleSize = size === 'sm' ? 'text-xs' : 'text-xs'

  return (
    <div className="flex items-center gap-3">
      {/* Icon: stylized cutting blade / gear */}
      <div
        className="rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          width: iconSize,
          height: iconSize,
          background: '#111',
          border: '1px solid #2a2a2a',
        }}
      >
        <svg
          width={iconSize * 0.65}
          height={iconSize * 0.65}
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Circular gear/blade shape */}
          <circle cx="14" cy="14" r="10" stroke="#d4780f" strokeWidth="1.5" fill="none" />
          <circle cx="14" cy="14" r="3.5" fill="#d4780f" />
          {/* Blade teeth */}
          <path d="M14 4 L15.5 8 L12.5 8 Z" fill="#d4780f" />
          <path d="M24 14 L20 15.5 L20 12.5 Z" fill="#d4780f" />
          <path d="M14 24 L12.5 20 L15.5 20 Z" fill="#d4780f" />
          <path d="M4 14 L8 12.5 L8 15.5 Z" fill="#d4780f" />
          {/* Diagonal teeth */}
          <path d="M21.07 6.93 L18.54 10.25 L16.61 8.32 Z" fill="#d4780f" />
          <path d="M21.07 21.07 L17.75 18.54 L19.68 16.61 Z" fill="#d4780f" />
          <path d="M6.93 21.07 L9.46 17.75 L11.39 19.68 Z" fill="#d4780f" />
          <path d="M6.93 6.93 L10.25 9.46 L8.32 11.39 Z" fill="#d4780f" />
        </svg>
      </div>

      {/* Text */}
      <div className="flex flex-col leading-none">
        <span className={`font-bold tracking-widest text-white ${titleSize}`}>SPINCUT</span>
        <span className={`tracking-widest font-medium ${subtitleSize}`} style={{ color: '#8a8a8a' }}>
          OUTILS CNC
        </span>
      </div>
    </div>
  )
}
