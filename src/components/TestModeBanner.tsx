export default function TestModeBanner() {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold" style={{ background: '#1a1400', color: '#fbbf24', borderBottom: '1px solid #3a2a00' }}>
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      </svg>
      Mode test — aucune donnée enregistrée
    </div>
  )
}
