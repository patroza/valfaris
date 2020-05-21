import { summonFor } from "@morphic-ts/batteries/lib/summoner-ESBAST";

const { summon, tagged } = summonFor({})

const SomeInterface = summon((F) => F.interface({
    a: F.array(F.string()),
    b: F.string(),
    c: F.number(),
    d: F.interface({
        value: F.string(),
        key: F.number(),
    }, "d"),
    e: NamedInterface(F),
    f: SomeType(F),
    g: F.array(SomeType(F)),
    h: F.array(F.interface({ t: SomeType(F), }, "Anon")),
    i: F.array(F.interface({ t: SomeType(F), }, "Anon1")),
}, "SomeInterface"))

const NamedInterface = summon((F) => F.interface({
    title: F.string(),
    arr: F.array(F.string()),
}, "NamedInterface"))

const SomeType = summon((F) => F.interface({
    h: F.date(),
}, "SomeType"))
