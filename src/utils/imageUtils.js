const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

export function validateImageFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}. Use JPEG, PNG, HEIC, or WebP.`)
  }
  if (file.size > MAX_BYTES) {
    throw new Error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max is 5 MB.`)
  }
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
