export default function ScanStatusBanner({ variant, tripCount, message, onRetry }) {
  const styles = {
    success: { bg: '#F0FDF4', border: '#86EFAC', color: '#166534', icon: '✓' },
    partial: { bg: '#FFFBEB', border: '#FCD34D', color: '#92400E', icon: '⚠' },
    error:   { bg: '#FEF2F2', border: '#FECACA', color: '#DC2626', icon: '✕' },
  }

  const s = styles[variant] ?? styles.error

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      backgroundColor: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 10, padding: '12px 16px', fontSize: 14, color: s.color,
    }}>
      <span style={{ fontWeight: 700, fontSize: 16, lineHeight: 1 }}>{s.icon}</span>
      <div style={{ flex: 1 }}>
        {variant !== 'error' && tripCount != null && (
          <strong>{tripCount} trip{tripCount !== 1 ? 's' : ''} extracted. </strong>
        )}
        {message}
      </div>
      {onRetry && (
        <button onClick={onRetry} style={{
          background: 'none', border: `1px solid ${s.border}`, borderRadius: 6,
          padding: '4px 10px', fontSize: 13, color: s.color, cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          Retry
        </button>
      )}
    </div>
  )
}
