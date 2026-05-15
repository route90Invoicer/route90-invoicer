'use client'

import { Menu } from 'lucide-react'

export default function TopBar({ title, userInitial = 'U', onMenuClick }) {
  return (
    <header className="h-14 bg-white border-b border-black/[0.06] flex items-center px-4 lg:px-6 gap-3 lg:gap-4 flex-shrink-0">
      {/* Hamburger — mobile/tablet only */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="w-11 h-11 flex items-center justify-center rounded-lg text-[#3C3C43] hover:bg-[#F2F2F7] transition-colors duration-100 lg:hidden bg-transparent border-none cursor-pointer flex-shrink-0"
      >
        <Menu size={22} strokeWidth={2} />
      </button>

      {/* Mobile: centered Route90 name. Desktop: left-aligned title */}
      <div className="flex-1 min-w-0 flex justify-center lg:justify-start">
        {/* Mobile app name (centered) */}
        <span className="text-[15px] font-semibold text-[#1D1D1F] tracking-tight lg:hidden">
          Route90
        </span>
        {/* Desktop: page title */}
        {title && (
          <span className="hidden lg:inline text-[14px] font-semibold text-[#1D1D1F] tracking-tight truncate">
            {title}
          </span>
        )}
      </div>

      {/* Right: avatar */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 lg:w-8 lg:h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[13px] font-semibold flex-shrink-0 cursor-default select-none">
          {userInitial}
        </div>
      </div>
    </header>
  )
}
