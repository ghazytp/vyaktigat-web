import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slugs, secret } = body

    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ message: "Invalid secret" }, { status: 401 })
    }

    if (!slugs || !Array.isArray(slugs)) {
      return NextResponse.json(
        { revalidated: false, message: "Missing or invalid slugs array" },
        { status: 400 }
      )
    }

    for (const slug of slugs) {
      revalidatePath(`/notes/${slug}`)
    }

    return NextResponse.json({ revalidated: true, slugs })
  } catch (err) {
    return NextResponse.json(
      { revalidated: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}
