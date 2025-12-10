export const isTimestampToday = (timestamp?: number) => {
  if (!timestamp) { return false }
  const normalizedTimestamp = timestamp > 1e12 ? timestamp : timestamp * 1000
  const createdAt = new Date(normalizedTimestamp)
  const today = new Date()

  return createdAt.getFullYear() === today.getFullYear()
    && createdAt.getMonth() === today.getMonth()
    && createdAt.getDate() === today.getDate()
}
