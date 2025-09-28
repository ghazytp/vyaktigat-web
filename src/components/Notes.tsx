import Link from "next/link"
import { getPostList } from "@/lib/noteHelper"
import { formatDate } from "@/lib/dateHelper"

export default async function Notes() {
  const posts = await getPostList()

  return (
    <section id="notes" className="pb-4">
      <h2 className="text-lg font-bold">Recent Notes :</h2>
      <ul className="space-y-1">
        {posts.map((post, i) => (
          <li key={i} className="grid grid-cols-[1fr_0.5fr]">
            <Link
              className="url-list underline text-blue-800 "
              href={`/notes/${post.slug}`}>
              {post.title}
            </Link>

            {post.date && (
              <span className="justify-self-end text-gray-500">
                {formatDate(post.date)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
