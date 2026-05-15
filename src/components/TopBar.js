'use client'

export default function TopBar({ title, userInitial = 'U' }) {
  return (
    <header className="h-14 bg-white border-b border-black/[0.06] flex items-center px-6 gap-4 flex-shrink-0">
      {/* Left: page title / breadcrumb */}
      <div className="flex-1 min-w-0">
        {title && (
          <span className="text-[14px] font-semibold text-[#1D1D1F] tracking-tight truncate">
            {title}
          </span>
        )}
      </div>

      {/* Right: avatar */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[13px] font-semibold flex-shrink-0 cursor-default select-none">
          {userInitial}
        </div>
      </div>
    </header>
  )
}
