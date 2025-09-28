"use client"
import React, { useEffect, useRef, useState } from "react"
import {
  FluidSolver,
  IX,
  blendChars,
  densityToCharCustom,
  getCharDensity,
} from "@/lib/renderASCIIHelper"

export default function RenderASCIIArt({
  ascii,
  width = 50,
  height = 50,
  velocityDecay = 0.98,
}: {
  ascii: string
  width?: number
  height?: number
  velocityDecay?: number
}) {
  const [frame, setFrame] = useState("")
  const fluidRef = useRef<FluidSolver | null>(null)
  const asciiGrid = useRef<string[][]>([])

  // Prepare ASCII art grid
  useEffect(() => {
    const lines = ascii.split("\n")
    asciiGrid.current = Array.from({ length: height }, (_, y) =>
      Array.from({ length: width }, (_, x) => lines[y]?.[x] ?? " ")
    )
  }, [ascii, width, height])

  // Initialize fluid solver
  useEffect(() => {
    fluidRef.current = new FluidSolver(width, height, 0.0001, 0.0001, 0.1)

    // Generate base density from ASCII art
    const baseDensity = new Float32Array((width + 2) * (height + 2))
    for (let y = 1; y <= height; y++) {
      for (let x = 1; x <= width; x++) {
        const char = asciiGrid.current[y - 1]?.[x - 1] ?? " "
        baseDensity[IX(x, y, width)] = getCharDensity(char)
      }
    }

    fluidRef.current.setBaseDensity(baseDensity)

    const interval = setInterval(() => {
      const fluid = fluidRef.current!
      fluid.step(velocityDecay)

      let output = ""
      for (let y = 1; y <= height; y++) {
        for (let x = 1; x <= width; x++) {
          const d = fluid.density[IX(x, y, width)]
          const baseChar = asciiGrid.current[y - 1]?.[x - 1] ?? " "

          output += d > 1 ? densityToCharCustom(d / 40) : baseChar
        }
        output += "\n"
      }
      setFrame(output)
    }, 50)

    return () => clearInterval(interval)
  }, [width, height, velocityDecay])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.target as HTMLDivElement).getBoundingClientRect()
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * width)
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * height)

    fluidRef.current?.addDensity(x, y, 80)
    fluidRef.current?.addVelocity(
      x,
      y,
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 6
    )
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.target as HTMLDivElement).getBoundingClientRect()
    const cx = Math.floor(((e.clientX - rect.left) / rect.width) * width)
    const cy = Math.floor(((e.clientY - rect.top) / rect.height) * height)

    const radius = 2
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        if (x * x + y * y <= radius * radius) {
          fluidRef.current?.addDensity(cx + x, cy + y, 150)
        }
      }
    }
  }

  return (
    <div className="flex flex-col justify-center text-sm h-32 w-full">
      {frame === "" ? <>Loading....</> : <></>}

      <div
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        className="w-full overflow-hidden">
        <pre className="font-mono text-[10px] leading-none select-none mx-auto scale-">
          {frame}
        </pre>
      </div>
    </div>
  )
}
