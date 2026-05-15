'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

const TYPE_MAP = {
  success: {
    Icon: CheckCircle2,
    borderCls: 'border-l-[#34C759]',
    iconCls: 'text-[#34C759]',
  },
  error: {
    Icon: XCircle,
    borderCls: 'border-l-[#FF3B30]',
    iconCls: 'text-[#FF3B30]',
  },
  warning: {
    Icon: AlertTriangle,
    borderCls: 'border-l-[#FF9500]',
    iconCls: 'text-[#FF9500]',
  },
}

export default function Toast({ message, type = 'success', visible }) {
  const [show, setShow] = useState(false)
  const { Icon, borderCls, iconCls } = TYPE_MAP[type] ?? TYPE_MAP.success

  useEffect(() => {
    if (!visible) { setShow(false); return }
    setShow(true)
    const t = setTimeout(() => setShow(false), 4000)
    return () => clearTimeout(t)
  }, [visible, message])

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'fixed bottom-6 right-6 z-[9999] transition-all duration-200 ease-out pointer-events-none',
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
      ].join(' ')}
      style={{ pointerEvents: show ? 'auto' : 'none' }}
    >
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.16)] border border-black/[0.06] border-l-4 ${borderCls} max-w-xs`}>
        <Icon size={16} strokeWidth={2} className={`flex-shrink-0 ${iconCls}`} />
        <span className="text-[13.5px] font-medium text-[#1D1D1F] leading-snug">
          {message}
        </span>
      </div>
    </div>
  )
}
