import Notes from "@/components/Notes"
import RenderASCIIArt from "@/components/RenderASCIIArt"
import content from "@/data/content.json"
import { self_potrait } from "@/lib/utils"
import { Metadata } from "next"
import { headers } from "next/headers"
import Link from "next/link"


export default function Home() {
  return (
    <div className="space-y-6 relative">
      <section className="space-y-4">
        <RenderASCIIArt
          ascii={self_potrait}
          width={100}
          height={15}
          velocityDecay={0.99}
        />

        <div className="space-y-3">
          {content.about.description.map((desc, i) => (
            <p key={i}>{desc}</p>
          ))}
        </div>
      </section>

      <section id="experiences">
        <h2 className="text-lg font-bold">Experiences</h2>
        <div>
          <ul className="space-y-1">
            {content.experiences.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_0.5fr]">
                <div className="flex space-x-1 flex-wrap">
                  <span>{item.company}</span>
                  <span className="text-gray-500">{`(${item.role})`}</span>
                </div>
                <p className="text-gray-500 justify-self-end">{item.date}</p>
              </div>
            ))}
          </ul>
        </div>
      </section>

      <section id="side-project">
        <h2 className="text-lg font-bold">Side Project</h2>
        <div>
          <ul className="space-y-1">
            {content.sideProjects.map((item, i) => (
              <div key={i} className="flex justify-between">
                {item.url ? (
                  <Link
                    className="url-list"
                    target="_blank"
                    href={item.url ?? ""}>
                    {item.title} {item.url && <span>↗</span>}
                  </Link>
                ) : (
                  <p>{item.title}</p>
                )}
                <p className="text-gray-500">{item.date}</p>
              </div>
            ))}
          </ul>
        </div>
      </section>

      <Notes />
    </div>
  )
}
