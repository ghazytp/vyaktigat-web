export const chars = " .:-=+*#%@"

// Convert density value to a fluid char
export function densityToChar(density: number): string {
  const index = Math.min(
    chars.length - 1,
    Math.floor(density * (chars.length - 1))
  )
  return chars[index]
}

// Custom densityToChar for your art
export const fluidChars = [" ", ".", ":", ";", "+", "x", "X", "$", "&", "@", "#", "%"];// map low→high density

// Map any ASCII character to a density value (0 = space, higher = darker)
export const getCharDensity = (char: string) => {
  const index = fluidChars.indexOf(char)
  if (index === -1) return 1 // default density for unknown chars
  return index / (fluidChars.length - 1) // normalized 0..1
}

// Revert back density value to representing characters
export function densityToCharCustom(density: number) {
  // Clamp density to 0..1
  const clamped = Math.min(1, Math.max(0, density))

  // Scale to index in fluidChars
  const index = Math.floor(clamped * (fluidChars.length - 1))

  return fluidChars[index]
}

export function blendChars(base: string, fluid: string, density: number) {
  const baseDensity = getCharDensity(base);
  const fluidDensity = getCharDensity(fluid);
  const blendedDensity = baseDensity + (fluidDensity - baseDensity) * Math.min(density, 1);
  return densityToCharCustom(blendedDensity);
}

export function IX(x: number, y: number, width: number) {
  return x + y * (width + 2)
}

export class FluidSolver {
  width: number
  height: number
  diff: number
  visc: number
  dt: number

  s: Float32Array
  density: Float32Array
  baseDensity: Float32Array
  Vx: Float32Array
  Vy: Float32Array
  Vx0: Float32Array
  Vy0: Float32Array

  constructor(
    width: number,
    height: number,
    diffusion: number,
    viscosity: number,
    dt: number
  ) {
    this.width = width
    this.height = height
    this.diff = diffusion
    this.visc = viscosity
    this.dt = dt

    const size = (width + 2) * (height + 2)
    this.s = new Float32Array(size)
    this.density = new Float32Array(size)
    this.baseDensity = new Float32Array(size)
    this.Vx = new Float32Array(size)
    this.Vy = new Float32Array(size)
    this.Vx0 = new Float32Array(size)
    this.Vy0 = new Float32Array(size)
  }

  setBaseDensity(densityArray: Float32Array) {
    this.baseDensity.set(densityArray)
    this.density.set(densityArray)
  }

  addDensity(x: number, y: number, amount: number) {
    if (x < 1 || x > this.width || y < 1 || y > this.height) return
    this.density[IX(x, y, this.width)] += amount
  }

  addVelocity(x: number, y: number, amountX: number, amountY: number) {
    if (x < 1 || x > this.width || y < 1 || y > this.height) return
    const i = IX(x, y, this.width)
    this.Vx[i] += amountX
    this.Vy[i] += amountY
  }

  reset() {
    this.s.fill(0)
    this.density.fill(0)
    this.baseDensity.fill(0)
    this.Vx.fill(0)
    this.Vy.fill(0)
    this.Vx0.fill(0)
    this.Vy0.fill(0)
  }

  step(decay: number) {
    const W = this.width
    const H = this.height

    diffuse(1, this.Vx0, this.Vx, this.visc, this.dt, W, H)
    diffuse(2, this.Vy0, this.Vy, this.visc, this.dt, W, H)
    project(this.Vx0, this.Vy0, this.Vx, this.Vy, W, H)

    advect(1, this.Vx, this.Vx0, this.Vx0, this.Vy0, this.dt, W, H)
    advect(2, this.Vy, this.Vy0, this.Vx0, this.Vy0, this.dt, W, H)
    project(this.Vx, this.Vy, this.Vx0, this.Vy0, W, H)

    diffuse(0, this.s, this.density, this.diff, this.dt, W, H)
    advect(0, this.density, this.s, this.Vx, this.Vy, this.dt, W, H)

    // decay density slowly
    for (let i = 0; i < this.density.length; i++) {
      this.density[i] *= decay
      // auto-restore toward base density
      this.density[i] = this.density[i] * 0.92 + this.baseDensity[i] * 0.08
    }
  }
}

// =============== Fluid Math Functions ===============
export function lin_solve(
  b: number,
  x: Float32Array,
  x0: Float32Array,
  a: number,
  c: number,
  W: number,
  H: number
) {
  for (let k = 0; k < 20; k++) {
    for (let i = 1; i <= W; i++) {
      for (let j = 1; j <= H; j++) {
        x[IX(i, j, W)] =
          (x0[IX(i, j, W)] +
            a *
              (x[IX(i - 1, j, W)] +
                x[IX(i + 1, j, W)] +
                x[IX(i, j - 1, W)] +
                x[IX(i, j + 1, W)])) /
          c
      }
    }
    set_bnd(b, x, W, H)
  }
}

export function diffuse(
  b: number,
  x: Float32Array,
  x0: Float32Array,
  diff: number,
  dt: number,
  W: number,
  H: number
) {
  const a = dt * diff * W * H
  lin_solve(b, x, x0, a, 1 + 4 * a, W, H)
}

export function advect(
  b: number,
  d: Float32Array,
  d0: Float32Array,
  velocX: Float32Array,
  velocY: Float32Array,
  dt: number,
  W: number,
  H: number
) {
  const dt0 = dt * W
  for (let i = 1; i <= W; i++) {
    for (let j = 1; j <= H; j++) {
      let x = i - dt0 * velocX[IX(i, j, W)]
      let y = j - dt0 * velocY[IX(i, j, W)]

      if (x < 0.5) x = 0.5
      if (x > W + 0.5) x = W + 0.5
      const i0 = Math.floor(x)
      const i1 = i0 + 1

      if (y < 0.5) y = 0.5
      if (y > H + 0.5) y = H + 0.5
      const j0 = Math.floor(y)
      const j1 = j0 + 1

      const s1 = x - i0
      const s0 = 1 - s1
      const t1 = y - j0
      const t0 = 1 - t1

      d[IX(i, j, W)] =
        s0 * (t0 * d0[IX(i0, j0, W)] + t1 * d0[IX(i0, j1, W)]) +
        s1 * (t0 * d0[IX(i1, j0, W)] + t1 * d0[IX(i1, j1, W)])
    }
  }
  set_bnd(b, d, W, H)
}

export function project(
  velocX: Float32Array,
  velocY: Float32Array,
  p: Float32Array,
  div: Float32Array,
  W: number,
  H: number
) {
  for (let i = 1; i <= W; i++) {
    for (let j = 1; j <= H; j++) {
      div[IX(i, j, W)] =
        (-0.5 *
          (velocX[IX(i + 1, j, W)] -
            velocX[IX(i - 1, j, W)] +
            velocY[IX(i, j + 1, W)] -
            velocY[IX(i, j - 1, W)])) /
        W
      p[IX(i, j, W)] = 0
    }
  }
  set_bnd(0, div, W, H)
  set_bnd(0, p, W, H)

  lin_solve(0, p, div, 1, 4, W, H)

  for (let i = 1; i <= W; i++) {
    for (let j = 1; j <= H; j++) {
      velocX[IX(i, j, W)] -= 0.5 * W * (p[IX(i + 1, j, W)] - p[IX(i - 1, j, W)])
      velocY[IX(i, j, W)] -= 0.5 * W * (p[IX(i, j + 1, W)] - p[IX(i, j - 1, W)])
    }
  }
  set_bnd(1, velocX, W, H)
  set_bnd(2, velocY, W, H)
}

export function set_bnd(b: number, x: Float32Array, W: number, H: number) {
  for (let i = 1; i <= W; i++) {
    x[IX(0, i, W)] = b === 1 ? -x[IX(1, i, W)] : x[IX(1, i, W)]
    x[IX(W + 1, i, W)] = b === 1 ? -x[IX(W, i, W)] : x[IX(W, i, W)]
    x[IX(i, 0, W)] = b === 2 ? -x[IX(i, 1, W)] : x[IX(i, 1, W)]
    x[IX(i, H + 1, W)] = b === 2 ? -x[IX(i, H, W)] : x[IX(i, H, W)]
  }

  x[IX(0, 0, W)] = 0.5 * (x[IX(1, 0, W)] + x[IX(0, 1, W)])
  x[IX(0, H + 1, W)] = 0.5 * (x[IX(1, H + 1, W)] + x[IX(0, H, W)])
  x[IX(W + 1, 0, W)] = 0.5 * (x[IX(W, 0, W)] + x[IX(W + 1, 1, W)])
  x[IX(W + 1, H + 1, W)] = 0.5 * (x[IX(W, H + 1, W)] + x[IX(W + 1, H, W)])
}
