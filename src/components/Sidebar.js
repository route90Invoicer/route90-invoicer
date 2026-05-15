'use client'

import Link from 'next/link'
import { LayoutDashboard, FilePlus, Camera, Settings, LogOut, X } from 'lucide-react'
import { signOut } from '@/app/actions/auth'

const mainNav = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/invoices/new', label: 'New Invoice', Icon: FilePlus },
  { href: '/invoices/scan', label: 'Scan Trip Sheet', Icon: Camera },
]

export default function Sidebar({ user, isOpen = false, onClose = () => {} }) {
  const initial = user?.email?.[0]?.toUpperCase() ?? 'U'
  const emailDisplay = user?.email ?? 'User'

  return (
    <>
      {/* Backdrop — mobile/tablet only */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={[
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] transition-opacity duration-200 lg:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 w-[260px] bg-[#0A0A0F] flex flex-col',
          'transition-transform duration-200 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static lg:w-[220px] lg:flex-shrink-0 lg:min-h-screen',
        ].join(' ')}
      >
        {/* Logo + mobile close */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-[10px] bg-indigo-600 flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0">
            R90
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-semibold text-[14px] leading-tight">Route90</div>
            <div className="text-white/40 text-[11px] leading-tight">Invoicer</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="w-11 h-11 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors duration-100 lg:hidden bg-transparent border-none cursor-pointer"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          <div className="text-[10px] font-semibold tracking-[0.08em] uppercase text-white/25 px-2 mb-2">
            Menu
          </div>
          {mainNav.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="sidebar-link flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-[8px] text-white/55 text-[14px] lg:text-[13.5px] font-medium no-underline transition-colors duration-100 min-h-[44px] lg:min-h-0"
            >
              <Icon size={16} strokeWidth={1.75} className="flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4 flex flex-col gap-0.5 border-t border-white/[0.06] pt-3">
          <Link
            href="/settings"
            onClick={onClose}
            className="sidebar-link flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-[8px] text-white/55 text-[14px] lg:text-[13.5px] font-medium no-underline transition-colors duration-100 min-h-[44px] lg:min-h-0"
          >
            <Settings size={16} strokeWidth={1.75} className="flex-shrink-0" />
            Settings
          </Link>

          {/* User row */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 mt-1">
            <div className="w-8 h-8 rounded-full bg-indigo-600/80 flex items-center justify-center text-white text-[12px] font-semibold flex-shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white/70 text-[11.5px] font-medium truncate">
                {emailDisplay}
              </div>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                title="Sign out"
                className="flex items-center justify-center text-white/30 hover:text-white/60 transition-colors duration-100 w-10 h-10 lg:w-7 lg:h-7 rounded cursor-pointer bg-transparent border-none"
              >
                <LogOut size={15} strokeWidth={1.75} />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  )
}
