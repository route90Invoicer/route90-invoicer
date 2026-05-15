'use client'

export default function ToggleSwitch({ checked, onChange, disabled = false }) {
  function handleClick() {
    if (!disabled) onChange(!checked)
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      onClick={handleClick}
      className={[
        'relative inline-flex items-center w-11 h-[26px] rounded-full border-none p-[3px] flex-shrink-0',
        'transition-colors duration-150 ease-out',
        checked ? 'bg-indigo-600' : 'bg-[#D1D1D6]',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      <div
        className={[
          'w-5 h-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]',
          'transition-transform duration-150 ease-out',
          checked ? 'translate-x-[18px]' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  )
}
