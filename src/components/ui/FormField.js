export default function FormField({ label, required, error, children, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className={`text-[11px] font-semibold uppercase tracking-[0.06em] leading-none ${error ? 'text-[#FF3B30]' : 'text-[#6E6E73]'}`}>
          {label}
          {required && (
            <span className="text-[#FF3B30] ml-0.5" aria-hidden="true">*</span>
          )}
        </label>
      )}

      {children}

      {hint && !error && (
        <span className="text-[11.5px] text-[#8E8E93] leading-snug">{hint}</span>
      )}

      {error && (
        <span
          role="alert"
          className="text-[12px] text-[#FF3B30] leading-snug"
        >
          {error}
        </span>
      )}
    </div>
  )
}
