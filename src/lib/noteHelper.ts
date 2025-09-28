import matter from "gray-matter"
import { remark } from "remark"
import html from "remark-html"
import remarkGfm from "remark-gfm"

export type GitHubFile = {
  name: string
  path: string
  [key: string]: any
}

export type Notes = {
  name: string
  contentHtml: string
}

export type PostMeta = {
  title?: string
  description?: string
  author?: string
  coverImage?: string
  date?: string
  tags?: string[]
  slug?: string
  download_url?: string
}

const baseURL = `https://api.github.com/repos/${process.env.GITHUB_USER}/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_POST_PATH}/?ref=${process.env.GITHUB_BRANCH}`

export async function getPostList(): Promise<PostMeta[]> {
  const res = await fetch(baseURL, {
    headers: { Authorization: `token ${process.env.GITHUB_PAT}` },
    next: { revalidate: 3600 },
  })

  if (!res.ok) return []

  const files: GitHubFile[] = await res.json()
  const mdFiles = files.filter((file) => file.name.endsWith(".md"))

  // Fetch metadata for all markdown files in parallel
  const posts = await Promise.all(
    mdFiles.map(async (file) => {
      const res = await fetch(file.download_url, {
        headers: { Authorization: `token ${process.env.GITHUB_PAT}` },
      })
      const mdText = await res.text()

      const { data } = matter(mdText)

      return {
        title: data?.title || file.name.replace(".md", ""),
        date: data?.date,
        tags: data?.tags || [],
        slug: data?.slug,
        download_url: file.download_url,
      }
    })
  )

  // Sort posts by date descending
  posts.sort((a, b) =>
    a.date && b.date
      ? new Date(b.date).getTime() - new Date(a.date).getTime()
      : 0
  )

  return posts
}

export async function getPostContent(
  fileUrl: string
): Promise<{ meta: PostMeta; content: string }> {
  const res = await fetch(fileUrl, {
    headers: { Authorization: `token ${process.env.GITHUB_PAT}` },
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Failed to fetch markdown: ${res.status} - ${errorText}`)
  }

  const mdText = await res.text()

  const { data: meta, content: markdownContent } = matter(mdText)

  const processed = await remark()
    .use(remarkGfm)
    .use(html)
    .process(markdownContent)
  const contentHtml = processed.toString()

  return { meta, content: contentHtml }
}

export function getManualReadTime(markdown: string) {
  const words = markdown
    .replace(/[#_*>\-\n`]/g, "")
    .split(/\s+/)
    .filter(Boolean).length

  const wordsPerMinute = 200
  const minutes = Math.ceil(words / wordsPerMinute)

  return `${minutes} Min Read`
}
