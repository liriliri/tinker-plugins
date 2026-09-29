export type SolidSlide = {
  id: string
  nameKey: string
  kind: 'solid'
  color: string
}

export type CssSlide = {
  id: string
  nameKey: string
  kind: 'css'
  background: string
}

export type Slide = SolidSlide | CssSlide
