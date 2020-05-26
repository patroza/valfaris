import * as I from "./iots"

const NamedInterface_ = I.type(
  {
    title: I.string,
    arr: I.array(I.string),
  },
  "NamedInterface"
)
export const NamedInterface: I.Type<
  NamedInterface,
  typeof NamedInterface_["_O"],
  typeof NamedInterface_["_I"]
> = NamedInterface_
export interface NamedInterface extends I.TypeOf<typeof NamedInterface_> {}

const SomeType_ = I.type(
  {
    h: I.DateFromISOString,
  },
  "SomeType"
)
export const SomeType: I.Type<
  SomeType,
  typeof SomeType_["_O"],
  typeof SomeType_["_I"]
> = SomeType_
export interface SomeType extends I.TypeOf<typeof SomeType_> {}

const SomeInterface_ = I.type(
  {
    a: I.array(I.string),
    b: I.string,
    c: I.number,
    d: I.type({ value: I.string, key: I.number }, "d"),
    e: NamedInterface,
    f: SomeType,
    g: I.array(SomeType),
    h: I.array(I.type({ t: SomeType }, "H")),
    i: I.array(I.type({ t: SomeType }, "I")),
  },
  "SomeInterface"
)
export const SomeInterface: I.Type<
  SomeInterface,
  typeof SomeInterface_["_O"],
  typeof SomeInterface_["_I"]
> = SomeInterface_
export interface SomeInterface extends I.TypeOf<typeof SomeInterface_> {}
