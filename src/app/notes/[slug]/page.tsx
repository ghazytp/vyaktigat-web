import { formatDate } from "@/lib/dateHelper"
import {
  getManualReadTime,
  getPostContent,
  getPostList,
} from "@/lib/noteHelper"
import { Metadata } from "next"
import Link from "next/link"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = await getPostList()

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function getPostContentFromSlug(slug: string) {
  const posts = await getPostList()
  const post = posts.find((p) => p.slug === slug)

  if (!post) throw new Error("Post not found")

  return getPostContent(post?.download_url || "")
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const { meta } = await getPostContentFromSlug(slug) // new helper

  return {
    title: `Ghazy Prihanda | ${meta?.title}`,
    description: meta?.description,
    authors: { name: meta?.author },
    keywords: meta?.tags,
  }
}

export default async function Note({ params }: PageProps) {
  const slug = (await params).slug
  const posts = await getPostList()
  const post = posts.find((p) => p?.slug === slug)

  if (!post) return <div>Note not found</div>

  const { meta, content } = await getPostContent(post?.download_url || "")

  return (
    <article>
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-gray-500 text-xs">
            {meta.date && formatDate(meta.date)} · {getManualReadTime(content)}
          </p>

          <h1 className="text-lg font-semibold">{meta.title}</h1>

          <ul className="flex flex-wrap w-full space-x-2">
            {meta.tags?.map((tag, i) => (
              <li key={i} className="text-xs text-blue-500">{`#${tag}`}</li>
            ))}
          </ul>
        </div>

        <div
          className="prose prose-sm space-y-4 prose-hr:my-2 prose-headings:my-2 prose-headings:text-base prose-h1:mt-0 prose-h1:text-lg prose-td:p-1 prose-th:p-1 prose-li:my-0 prose-ol:ml-1 prose-ul:ml-1 prose-p:my-3"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        <div className="mt-12">
          <Link href="/" className="btn">
            {"<< Back"}
          </Link>
        </div>
      </div>
    </article>
  )
}
