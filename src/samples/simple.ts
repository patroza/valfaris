export interface SomeInterface {
  a: string[]
  b: string
  c: number
  d: {
    value: string
    key: number
  }
  e: NamedInterface
  f: SomeType
  g: Array<SomeType>
  h: Array<{ t: SomeType }>
  i: { t: SomeType }[]
}

interface NamedInterface {
  title: string
  arr: string[]
}

type SomeType = {
  h: Date
}
