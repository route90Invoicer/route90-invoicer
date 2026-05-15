const PADDING_CLS = {
  none: 'p-0',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-7',
}

export default function Card({
  children,
  padding = 'md',
  header,
  footer,
  className = '',
  style: extraStyle = {},
}) {
  const padCls = PADDING_CLS[padding] ?? PADDING_CLS.md

  return (
    <div
      className={`bg-white rounded-[14px] border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden ${className}`}
      style={extraStyle}
    >
      {header && (
        <div className="px-5 py-4 border-b border-black/[0.06]">
          {typeof header === 'string' ? (
            <h3 className="text-[15px] font-semibold text-[#1D1D1F] tracking-tight">{header}</h3>
          ) : header}
        </div>
      )}

      <div className={padCls}>
        {children}
      </div>

      {footer && (
        <div className="px-5 py-3 border-t border-black/[0.06] bg-[#FAFAFA]">
          {footer}
        </div>
      )}
    </div>
  )
}
