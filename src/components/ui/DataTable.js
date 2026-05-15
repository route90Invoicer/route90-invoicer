'use client'

export default function DataTable({
  columns = [],
  data = [],
  onRowClick,
  emptyMessage = 'No data',
  emptySlot,
  mobileCard,
}) {
  if (!data.length) {
    return emptySlot ? (
      <div>{emptySlot}</div>
    ) : (
      <div className="py-10 text-center text-[13.5px] text-[#AEAEB2]">
        {emptyMessage}
      </div>
    )
  }

  return (
    <>
      {/* Mobile: card-per-row layout (only when mobileCard render fn provided) */}
      {mobileCard && (
        <div className="md:hidden flex flex-col">
          {data.map((row, rowIdx) => (
            <div
              key={row.id ?? rowIdx}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={[
                'px-4 py-3 border-b border-black/[0.05] last:border-0',
                onRowClick ? 'cursor-pointer active:bg-[#F8F8FA]' : '',
              ].join(' ')}
            >
              {mobileCard(row)}
            </div>
          ))}
        </div>
      )}

      {/* Desktop (or always, if no mobileCard provided): table */}
      <div className={`w-full overflow-x-auto ${mobileCard ? 'hidden md:block' : ''}`}>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#F9F9FB] border-b border-black/[0.07]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width ?? 'auto', textAlign: col.align ?? 'left' }}
                  className="px-4 py-2.5 text-[11px] font-semibold tracking-[0.06em] uppercase text-[#AEAEB2] whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => {
              const isLast = rowIdx === data.length - 1
              return (
                <tr
                  key={row.id ?? rowIdx}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={[
                    isLast ? '' : 'border-b border-black/[0.05]',
                    onRowClick ? 'cursor-pointer hover:bg-[#F8F8FA] transition-colors duration-100' : '',
                  ].join(' ')}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{ textAlign: col.align ?? 'left' }}
                      className="px-4 py-3 text-[13px] text-[#1D1D1F] leading-snug align-middle"
                    >
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
