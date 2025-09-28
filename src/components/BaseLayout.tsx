import content from "@/data/content.json"
import Link from "next/link"

const BaseLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="p-4 text-sm font-body space-y-4 min-h-screen mx-auto max-w-md flex flex-col">
      <header className="w-full">
        <h1 className="font-heading text-4xl tracking-wide">
          <Link href="/">{content.header.title}</Link>
        </h1>
        <nav>
          <ul className="flex space-x-4">
            {content.nav.map((nav, i) => (
              <li key={i}>
                <Link className="btn" href={nav.href}>
                  /{nav.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto w-full">{children}</main>

      <footer
        id="contact"
        className="w-full mt-auto relative space-y-8 before:content-[''] before:block before:w-1/3 before:h-[1.5px] before:bg-gray-400 before:mb-2">
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <span>[↗]: </span>
          <ul className="flex space-x-1 flex-wrap">
            {content.socials.map((item, i) => (
              <li key={i}>
                <Link
                  className="btn"
                  target="_blank"
                  href={
                    item.type == "email" ? `mailto:${item.href}` : item.href
                  }>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </div>
  )
}

export default BaseLayout
