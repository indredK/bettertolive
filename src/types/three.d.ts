declare module "three" {
  export class Object3D {
    position: {
      set: (x: number, y: number, z: number) => void
    }
    scale: {
      set: (x: number, y: number, z: number) => void
    }
    userData: Record<string, unknown>

    add: (...objects: Object3D[]) => this
  }

  export class AmbientLight extends Object3D {
    constructor(color?: string, intensity?: number)
  }

  export class DirectionalLight extends Object3D {
    constructor(color?: string, intensity?: number)
  }

  export class PointLight extends Object3D {
    constructor(color?: string, intensity?: number, distance?: number)
  }

  export class Group extends Object3D {}

  export class SphereGeometry {
    constructor(radius?: number, widthSegments?: number, heightSegments?: number)
  }

  export class MeshBasicMaterial {
    constructor(parameters?: {
      color?: string
      depthWrite?: boolean
      opacity?: number
      transparent?: boolean
    })
  }

  export class MeshStandardMaterial {
    constructor(parameters?: {
      color?: string
      emissive?: string
      emissiveIntensity?: number
      metalness?: number
      opacity?: number
      roughness?: number
      transparent?: boolean
    })
  }

  export class Mesh extends Object3D {
    constructor(geometry?: unknown, material?: unknown)
  }

  export class CanvasTexture {
    constructor(canvas: HTMLCanvasElement)

    generateMipmaps: boolean
    minFilter: unknown
    needsUpdate: boolean
  }

  export const LinearFilter: unknown

  export class SpriteMaterial {
    constructor(parameters?: {
      depthWrite?: boolean
      map?: CanvasTexture
      opacity?: number
      transparent?: boolean
    })
  }

  export class Sprite extends Object3D {
    constructor(material?: SpriteMaterial)
  }

  export type Material = unknown
  export type Light = Object3D
  export type Scene = Object3D
  export type Camera = Object3D
  export type Renderer = {
    render?: (...args: unknown[]) => unknown
  }
  export type WebGLRendererParameters = Record<string, unknown>

  export class WebGLRenderer {}
}
