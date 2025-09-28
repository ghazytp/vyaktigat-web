import { formatDate } from "@/lib/dateHelper"
import Link from "next/link"
type ListItemProps = {
  href?: string
  title?: string
  date?: string
}
const ListItem = ({ href, title, date }: ListItemProps) => {
  return (
    <div className="flex text-sm justify-between">
      <Link href={href || "#"} className="">{title}</Link>
      {date && <p>{date}</p>}
    </div>
  )
}

export default ListItem
