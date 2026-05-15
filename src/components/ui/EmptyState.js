export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 gap-3">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-[#F2F2F7] flex items-center justify-center mb-1 flex-shrink-0">
          <Icon size={26} strokeWidth={1.4} className="text-[#AEAEB2]" />
        </div>
      )}

      <div className="text-[16px] font-semibold text-[#1D1D1F] tracking-tight">
        {title}
      </div>

      {description && (
        <p className="m-0 text-[13.5px] text-[#6E6E73] leading-relaxed max-w-[280px]">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  )
}
