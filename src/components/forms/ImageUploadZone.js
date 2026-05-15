'use client'

import { useRef, useState } from 'react'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
const MAX_BYTES = 5 * 1024 * 1024

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Unsupported type: ${file.type}. Use JPEG, PNG, HEIC, or WebP.`
  }
  if (file.size > MAX_BYTES) {
    return `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max is 5 MB.`
  }
  return null
}

// statusChip renders a small pill for each file's scan state
function StatusPill({ status }) {
  const map = {
    ready:    { label: 'Ready',      bg: '#F3F4F6', color: '#374151' },
    scanning: { label: 'Scanning…',  bg: '#EEF2FF', color: '#4F46E5' },
    done:     { label: 'Done ✓',     bg: '#ECFDF5', color: '#059669' },
    error:    { label: 'Error',      bg: '#FEF2F2', color: '#DC2626' },
  }
  const s = map[status] ?? map.ready
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      backgroundColor: s.bg,
      color: s.color,
    }}>
      {s.label}
    </span>
  )
}

/**
 * ImageUploadZone — multi-file upload with per-file status chips.
 *
 * Props:
 *   onFilesChange(files[])  — called whenever the valid file list changes
 *   fileStatuses            — Map<File, 'ready'|'scanning'|'done'|'error'>
 *                             provided by parent so chips update live
 *   disabled                — bool, prevents adding/removing files while scanning
 */
export default function ImageUploadZone({ onFilesChange, fileStatuses = new Map(), disabled }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  // Internal list: { id, file, error }
  const [entries, setEntries] = useState([])

  function addFiles(incoming) {
    if (disabled) return
    const next = [...entries]
    for (const file of Array.from(incoming)) {
      const err = validateFile(file)
      const id = `${file.name}-${file.size}-${file.lastModified}`
      // Skip exact duplicates (same name+size+mtime already in list)
      const alreadyIn = next.some(e => e.id === id)
      if (!alreadyIn) {
        next.push({ id, file, error: err })
      }
    }
    setEntries(next)
    // Notify parent with only valid files
    onFilesChange(next.filter(e => !e.error).map(e => e.file))
  }

  function removeEntry(id) {
    const next = entries.filter(e => e.id !== id)
    setEntries(next)
    onFilesChange(next.filter(e => !e.error).map(e => e.file))
  }

  function handleInputChange(e) {
    if (e.target.files?.length) {
      addFiles(e.target.files)
    }
    // Reset input so the same file can be re-added after removal
    e.target.value = ''
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files)
    }
  }

  function handleDragOver(e) {
    e.preventDefault()
    if (!disabled) setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  return (
    <div>
      {/* Drop zone — always visible so more files can be added */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#4F46E5' : 'rgba(0,0,0,0.15)'}`,
          borderRadius: 12,
          padding: entries.length > 0 ? '20px 24px' : '40px 24px',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: dragging ? '#EEF2FF' : 'white',
          transition: 'all 0.15s ease',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {entries.length === 0 && (
          <>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#1D1D1F', marginBottom: 6 }}>
              Drop your trip sheets here
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
              or click to browse · JPEG, PNG, HEIC, WebP · max 5 MB each
            </div>
          </>
        )}
        <div style={{
          display: 'inline-block',
          backgroundColor: entries.length > 0 ? 'white' : '#4F46E5',
          color: entries.length > 0 ? '#4F46E5' : 'white',
          border: entries.length > 0 ? '1px solid #4F46E5' : 'none',
          borderRadius: 8,
          padding: '8px 20px',
          fontSize: 14,
          fontWeight: 500,
          pointerEvents: 'none',
        }}>
          {entries.length > 0 ? '+ Add more sheets' : 'Choose files / Take photo'}
        </div>
      </div>

      {/* Per-file chips */}
      {entries.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map(({ id, file, error }) => {
            const status = fileStatuses.get(file) ?? 'ready'
            return (
              <div key={id} style={{
                border: error
                  ? '1px solid #FECACA'
                  : '1px solid rgba(0,0,0,0.10)',
                borderRadius: 10,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                backgroundColor: error ? '#FEF2F2' : 'white',
              }}>
                {/* File icon */}
                <span style={{ fontSize: 22, lineHeight: 1 }}>🖼️</span>

                {/* Name + size */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#1D1D1F',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {file.name}
                  </div>
                  {error ? (
                    <div style={{ fontSize: 12, color: '#DC2626', marginTop: 2 }}>{error}</div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      {formatBytes(file.size)}
                    </div>
                  )}
                </div>

                {/* Status pill — only for valid files */}
                {!error && <StatusPill status={status} />}

                {/* Remove button */}
                {!disabled && (
                  <button
                    onClick={e => { e.stopPropagation(); removeEntry(id) }}
                    style={{
                      background: 'none',
                      border: '1px solid rgba(0,0,0,0.12)',
                      borderRadius: 6,
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: 16,
                      color: '#6B7280',
                      flexShrink: 0,
                    }}
                    title="Remove file"
                  >
                    ×
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />
    </div>
  )
}
