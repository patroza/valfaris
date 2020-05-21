import * as I from "./iots"

export const SomeType = I.type({
  h: I.DateFromISOString,
})
export interface SomeType extends I.TypeOf<typeof SomeType> {}

export const NamedInterface = I.type({
  title: I.string,
  arr: I.array(I.string),
})
export interface NamedInterface extends I.TypeOf<typeof NamedInterface> {}

export const SomeInterface = I.type({
  a: I.array(I.string),
  b: I.string,
  c: I.number,
  d: I.type({ value: I.string, key: I.number }),
  e: NamedInterface,
  f: SomeType,
  g: I.array(SomeType),
  h: I.array(I.type({ t: SomeType })),
  i: I.array(I.type({ t: SomeType })),
})
export interface SomeInterface extends I.TypeOf<typeof SomeInterface> {}
