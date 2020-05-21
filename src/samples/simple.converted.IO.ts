import * as I from "io-ts"
import { DateFromISOString } from "io-ts-types/lib/DateFromISOString"

const IT = { DateFromISOString }

const SomeType = I.type({
  h: IT.DateFromISOString,
})

const NamedInterface = I.type({
  title: I.string,
  arr: I.array(I.string),
})

const SomeInterface = I.type({
  a: I.array(I.string),
  b: I.string,
  c: I.number,
  d: I.type({
    value: I.string,
    key: I.number,
  }),
  e: NamedInterface,
  f: SomeType,
  g: I.array(SomeType),
  h: I.array(I.type({ t: SomeType })),
  i: I.array(I.type({ t: SomeType })),
})
