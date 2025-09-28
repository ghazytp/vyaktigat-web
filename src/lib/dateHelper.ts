export function formatDate(input: string | Date): string {
  const date = input instanceof Date ? input : new Date(input)

  const day = date.getDate().toString().padStart(2, "0")
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear()

  return `${month} ${day}, ${year}`
}
