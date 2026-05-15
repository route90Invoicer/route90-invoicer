const VARIANTS = {
  draft:   'bg-[#F2F2F7] text-[#6E6E73]',
  sent:    'bg-blue-50 text-blue-600',
  paid:    'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  info:    'bg-indigo-50 text-indigo-600',
}

export default function Badge({ variant = 'draft', children }) {
  const cls = VARIANTS[variant] ?? VARIANTS.draft
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide whitespace-nowrap leading-none ${cls}`}>
      {children}
    </span>
  )
}
