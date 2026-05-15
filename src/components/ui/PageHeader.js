export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="m-0 text-[24px] font-bold tracking-tight text-[#1D1D1F] leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="m-0 mt-1 text-[13.5px] text-[#6E6E73] leading-snug">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
          {actions}
        </div>
      )}
    </div>
  )
}
