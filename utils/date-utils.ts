export function formatDistanceToNow(date: Date | string | undefined): string {
  if (!date) return ""

  const dateObj = typeof date === "string" ? new Date(date) : date
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return ""

  const now = new Date()
  const diff = now.getTime() - dateObj.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (seconds < 60) return "now"
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`
  if (weeks < 4) return `${weeks}w`
  if (months < 12) return `${months}mo`
  return dateObj.toLocaleDateString()
}

export function formatTime(date: Date | string | undefined): string {
  if (!date) return ""

  const dateObj = typeof date === "string" ? new Date(date) : date
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return ""

  return dateObj.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}
