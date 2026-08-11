import type { ModelViewerElement } from '@google/model-viewer'

type ModelViewerJSX = React.DetailedHTMLProps<
  React.HTMLAttributes<ModelViewerElement>,
  ModelViewerElement
> & {
  src?: string
  poster?: string
  alt?: string
  exposure?: string | number
  'camera-controls'?: boolean
  'touch-action'?: string
  'shadow-intensity'?: string | number
  'shadow-softness'?: string | number
  'environment-image'?: string
  'interaction-prompt'?: string
  'auto-rotate'?: boolean
  autoplay?: boolean
  'interpolation-decay'?: string | number
  'min-camera-orbit'?: string
  'field-of-view'?: string
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerJSX
    }
  }
}

export {}
