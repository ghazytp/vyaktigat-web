"use client"
import React, { useEffect, useRef, useState } from "react"

const chars = " .:-=+*#%@"

function densityToChar(density: number): string {
  const index = Math.min(
    chars.length - 1,
    Math.floor(density * (chars.length - 1))
  )
  return chars[index]
}

function IX(x: number, y: number, N: number) {
  return x + y * (N + 2)
}

// =============== Fluid Solver ===============
class FluidSolver {
  N: number
  diff: number
  visc: number
  dt: number

  s: Float32Array
  density: Float32Array

  Vx: Float32Array
  Vy: Float32Array
  Vx0: Float32Array
  Vy0: Float32Array

  constructor(N: number, diffusion: number, viscosity: number, dt: number) {
    this.N = N
    this.diff = diffusion
    this.visc = viscosity
    this.dt = dt

    const size = (N + 2) * (N + 2)
    this.s = new Float32Array(size)
    this.density = new Float32Array(size)
    this.Vx = new Float32Array(size)
    this.Vy = new Float32Array(size)
    this.Vx0 = new Float32Array(size)
    this.Vy0 = new Float32Array(size)
  }

  addDensity(x: number, y: number, amount: number) {
    if (x < 1 || x > this.N || y < 1 || y > this.N) return
    this.density[IX(x, y, this.N)] += amount
  }

  addVelocity(x: number, y: number, amountX: number, amountY: number) {
    if (x < 1 || x > this.N || y < 1 || y > this.N) return
    const i = IX(x, y, this.N)
    this.Vx[i] += amountX
    this.Vy[i] += amountY
  }

  reset() {
    this.s.fill(0)
    this.density.fill(0)
    this.Vx.fill(0)
    this.Vy.fill(0)
    this.Vx0.fill(0)
    this.Vy0.fill(0)
  }

  step() {
    const N = this.N
    const visc = this.visc
    const diff = this.diff
    const dt = this.dt
    const Vx = this.Vx
    const Vy = this.Vy
    const Vx0 = this.Vx0
    const Vy0 = this.Vy0
    const s = this.s
    const density = this.density

    diffuse(1, Vx0, Vx, visc, dt, N)
    diffuse(2, Vy0, Vy, visc, dt, N)

    project(Vx0, Vy0, Vx, Vy, N)

    advect(1, Vx, Vx0, Vx0, Vy0, dt, N)
    advect(2, Vy, Vy0, Vx0, Vy0, dt, N)

    project(Vx, Vy, Vx0, Vy0, N)

    diffuse(0, s, density, diff, dt, N)
    advect(0, density, s, Vx, Vy, dt, N)
  }
}

// =============== Fluid Math Functions ===============
function lin_solve(
  b: number,
  x: Float32Array,
  x0: Float32Array,
  a: number,
  c: number,
  N: number
) {
  for (let k = 0; k < 20; k++) {
    for (let i = 1; i <= N; i++) {
      for (let j = 1; j <= N; j++) {
        x[IX(i, j, N)] =
          (x0[IX(i, j, N)] +
            a *
              (x[IX(i - 1, j, N)] +
                x[IX(i + 1, j, N)] +
                x[IX(i, j - 1, N)] +
                x[IX(i, j + 1, N)])) /
          c
      }
    }
    set_bnd(b, x, N)
  }
}

function diffuse(
  b: number,
  x: Float32Array,
  x0: Float32Array,
  diff: number,
  dt: number,
  N: number
) {
  const a = dt * diff * N * N
  lin_solve(b, x, x0, a, 1 + 4 * a, N)
}

function advect(
  b: number,
  d: Float32Array,
  d0: Float32Array,
  velocX: Float32Array,
  velocY: Float32Array,
  dt: number,
  N: number
) {
  const dt0 = dt * N
  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= N; j++) {
      let x = i - dt0 * velocX[IX(i, j, N)]
      let y = j - dt0 * velocY[IX(i, j, N)]

      if (x < 0.5) x = 0.5
      if (x > N + 0.5) x = N + 0.5
      const i0 = Math.floor(x)
      const i1 = i0 + 1

      if (y < 0.5) y = 0.5
      if (y > N + 0.5) y = N + 0.5
      const j0 = Math.floor(y)
      const j1 = j0 + 1

      const s1 = x - i0
      const s0 = 1 - s1
      const t1 = y - j0
      const t0 = 1 - t1

      d[IX(i, j, N)] =
        s0 * (t0 * d0[IX(i0, j0, N)] + t1 * d0[IX(i0, j1, N)]) +
        s1 * (t0 * d0[IX(i1, j0, N)] + t1 * d0[IX(i1, j1, N)])
    }
  }
  set_bnd(b, d, N)
}

function project(
  velocX: Float32Array,
  velocY: Float32Array,
  p: Float32Array,
  div: Float32Array,
  N: number
) {
  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= N; j++) {
      div[IX(i, j, N)] =
        (-0.5 *
          (velocX[IX(i + 1, j, N)] -
            velocX[IX(i - 1, j, N)] +
            velocY[IX(i, j + 1, N)] -
            velocY[IX(i, j - 1, N)])) /
        N
      p[IX(i, j, N)] = 0
    }
  }
  set_bnd(0, div, N)
  set_bnd(0, p, N)

  lin_solve(0, p, div, 1, 4, N)

  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= N; j++) {
      velocX[IX(i, j, N)] -= 0.5 * N * (p[IX(i + 1, j, N)] - p[IX(i - 1, j, N)])
      velocY[IX(i, j, N)] -= 0.5 * N * (p[IX(i, j + 1, N)] - p[IX(i, j - 1, N)])
    }
  }
  set_bnd(1, velocX, N)
  set_bnd(2, velocY, N)
}

function set_bnd(b: number, x: Float32Array, N: number) {
  for (let i = 1; i <= N; i++) {
    x[IX(0, i, N)] = b === 1 ? -x[IX(1, i, N)] : x[IX(1, i, N)]
    x[IX(N + 1, i, N)] = b === 1 ? -x[IX(N, i, N)] : x[IX(N, i, N)]
    x[IX(i, 0, N)] = b === 2 ? -x[IX(i, 1, N)] : x[IX(i, 1, N)]
    x[IX(i, N + 1, N)] = b === 2 ? -x[IX(i, N, N)] : x[IX(i, N, N)]
  }

  x[IX(0, 0, N)] = 0.5 * (x[IX(1, 0, N)] + x[IX(0, 1, N)])
  x[IX(0, N + 1, N)] = 0.5 * (x[IX(1, N + 1, N)] + x[IX(0, N, N)])
  x[IX(N + 1, 0, N)] = 0.5 * (x[IX(N, 0, N)] + x[IX(N + 1, 1, N)])
  x[IX(N + 1, N + 1, N)] = 0.5 * (x[IX(N, N + 1, N)] + x[IX(N + 1, N, N)])
}

// =============== React Component ===============
export default function FluidASCII() {
  const N = 60
  const [frame, setFrame] = useState<string>("")

  const fluidRef = useRef<FluidSolver | null>(null)

  useEffect(() => {
    fluidRef.current = new FluidSolver(N, 0.0001, 0.0001, 0.1)

    const interval = setInterval(() => {
      const fluid = fluidRef.current!
      fluid.step()

      let output = ""
      for (let y = 1; y <= N; y++) {
        for (let x = 1; x <= N; x++) {
          const d = fluid.density[IX(x, y, N)]
          output += densityToChar(d / 50)
        }
        output += "\n"
      }
      setFrame(output)
    }, 50)

    return () => clearInterval(interval)
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.target as HTMLDivElement).getBoundingClientRect()
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * N)
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * N)

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
    const cx = Math.floor(((e.clientX - rect.left) / rect.width) * N)
    const cy = Math.floor(((e.clientY - rect.top) / rect.height) * N)

    // Ripple: add density in a circle
    const radius = 2
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        if (x * x + y * y <= radius * radius) {
          fluidRef.current?.addDensity(cx + x, cy + y, 150)
        }
      }
    }
  }

  const handleReset = () => {
    fluidRef.current?.reset()
  }

  return (
    <div className="relative h-40 overflow-hidden">
      <button onClick={handleReset}>reset</button>
      <div className="absolute" onMouseMove={handleMouseMove} onClick={handleClick}>
        <pre className="font-mono text-xs leading-none select-none">
          {frame}
        </pre>
      </div>
    </div>
  )
}
