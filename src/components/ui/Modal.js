'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

// Overlay uses position:fixed — renders over the full viewport
export default function Modal({ isOpen, onClose, title, children, footer }) {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/30 backdrop-blur-[2px] sm:items-start sm:px-4 sm:pt-20 sm:pb-20"
    >
      <div className="bg-white border border-black/[0.06] w-full h-full flex flex-col overflow-hidden sm:rounded-[14px] sm:max-w-[520px] sm:h-auto sm:max-h-[calc(100vh-120px)] sm:shadow-[0_24px_64px_rgba(0,0,0,0.14)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06] flex-shrink-0">
          <h2 className="m-0 text-[16px] font-semibold text-[#1D1D1F] tracking-tight">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center w-11 h-11 sm:w-7 sm:h-7 rounded-lg text-[#AEAEB2] hover:text-[#6E6E73] hover:bg-[#F2F2F7] transition-colors duration-100"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="p-5 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-3.5 border-t border-black/[0.06] flex items-center justify-end gap-2 flex-shrink-0 bg-[#FAFAFA]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
