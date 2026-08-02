declare module 'color4bg' {
  export interface ColorBgParams {
    dom?: string
    colors?: string[]
    seed?: number
    loop?: boolean
    options?: Record<string, number>
  }

  export class ColorBg {
    name: string
    loop: boolean
    seed: number
    gl: WebGLRenderingContext & { canvas: HTMLCanvasElement }
    constructor(params?: ColorBgParams, num?: number)
    colors(colors: string[]): void
    reset(seed?: number): void
    update(option: string, val: string | number): void
    destroy(): void
    start(): void
    resize(): void
  }

  export class AbstractShapeBg extends ColorBg {}
  export class AestheticFluidBg extends ColorBg {}
  export class AmbientLightBg extends ColorBg {}
  export class BigBlobBg extends ColorBg {}
  export class BlurDotBg extends ColorBg {}
  export class BlurGradientBg extends ColorBg {}
  export class ChaosWavesBg extends ColorBg {}
  export class CurveGradientBg extends ColorBg {}
  export class GridArrayBg extends ColorBg {}
  export class RandomCubesBg extends ColorBg {}
  export class StepGradientBg extends ColorBg {}
  export class SwirlingCurvesBg extends ColorBg {}
  export class TrianglesMosaicBg extends ColorBg {}
  export class WavyWavesBg extends ColorBg {}
}
