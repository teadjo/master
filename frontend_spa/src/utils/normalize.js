export function normalizeArray(data) {
  if (Array.isArray(data)) return data

  if (data && Array.isArray(data.data)) return data.data

  return []
}