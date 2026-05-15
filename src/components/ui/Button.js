'use client'

import { Loader2 } from 'lucide-react'

const VARIANT_CLS = {
  primary:   'bg-indigo-600 text-white border border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700',
  secondary: 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50',
  danger:    'bg-red-500 text-white border border-red-500 hover:bg-red-600 hover:border-red-600',
  ghost:     'bg-transparent text-[#6E6E73] border border-transparent hover:text-[#1D1D1F] hover:bg-[#F2F2F7]',
}

const SIZE_CLS = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-9 px-4 text-[14px] gap-2',
  lg: 'h-11 px-5 text-[15px] gap-2',
}

const ICON_SIZE = { sm: 14, md: 16, lg: 18 }

export default function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  children,
  onClick,
  disabled,
  loading,
  type = 'button',
  className = '',
  style: extraStyle = {},
  ...rest
}) {
  const isDisabled = disabled || loading
  const vCls = VARIANT_CLS[variant] ?? VARIANT_CLS.primary
  const sCls = SIZE_CLS[size] ?? SIZE_CLS.md
  const iSize = ICON_SIZE[size] ?? 16

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      style={extraStyle}
      className={[
        'inline-flex items-center justify-center font-medium rounded-[9px] whitespace-nowrap',
        'transition-all duration-150 ease-out cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1',
        isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
        vCls,
        sCls,
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <Loader2 size={iSize} strokeWidth={2} className="animate-spin flex-shrink-0" />
      ) : Icon ? (
        <Icon size={iSize} strokeWidth={1.75} className="flex-shrink-0" />
      ) : null}
      {children}
    </button>
  )
}
