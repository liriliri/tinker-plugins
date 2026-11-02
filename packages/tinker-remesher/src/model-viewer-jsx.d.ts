import type { ModelViewerElement } from '@google/model-viewer'

type ModelViewerJSX = React.DetailedHTMLProps<
  React.HTMLAttributes<ModelViewerElement>,
  ModelViewerElement
> & {
  src?: string
  poster?: string
  alt?: string
  loading?: 'auto' | 'lazy' | 'eager'
  exposure?: string | number
  'camera-controls'?: boolean
  'touch-action'?: string
  'shadow-intensity'?: string | number
  'shadow-softness'?: string | number
  'environment-image'?: string
  'interaction-prompt'?: string
  'auto-rotate'?: boolean
  autoplay?: boolean
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerJSX
    }
  }
}

export {}
