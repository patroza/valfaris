import * as MO from "./morphic"

const NamedInterface_ = MO.summon((F) =>
  F.interface(
    {
      title: F.string(),
      arr: F.array(F.string()),
    },
    "NamedInterface"
  )
)
export interface NamedInterface extends MO.AType<typeof NamedInterface_> {}
export interface NamedInterfaceRaw extends MO.EType<typeof NamedInterface_> {}
export const NamedInterface = MO.AsOpaque<NamedInterfaceRaw, NamedInterface>()(
  NamedInterface_
)

const SomeType_ = MO.summon((F) =>
  F.interface(
    {
      h: F.date(),
    },
    "SomeType"
  )
)
export interface SomeType extends MO.AType<typeof SomeType_> {}
export interface SomeTypeRaw extends MO.EType<typeof SomeType_> {}
export const SomeType = MO.AsOpaque<SomeTypeRaw, SomeType>()(SomeType_)

const SomeInterface_ = MO.summon((F) =>
  F.interface(
    {
      a: F.array(F.string()),
      b: F.string(),
      c: F.number(),
      d: F.interface({ value: F.string(), key: F.number() }, "D"),
      e: NamedInterface(F),
      f: SomeType(F),
      g: F.array(SomeType(F)),
      h: F.array(F.interface({ t: SomeType(F) }, "H")),
      i: F.array(F.interface({ t: SomeType(F) }, "I")),
    },
    "SomeInterface"
  )
)
export interface SomeInterface extends MO.AType<typeof SomeInterface_> {}
export interface SomeInterfaceRaw extends MO.EType<typeof SomeInterface_> {}
export const SomeInterface = MO.AsOpaque<SomeInterfaceRaw, SomeInterface>()(
  SomeInterface_
)
