export const config = {
  morphic: {
    //mergeHeritage: true,
    mergeHeritage: false,
    // import * as MO from "./morphic"
    import: `import { Morphic as MO } from "@/framework"`,
  },
  mmorphic: {
    //mergeHeritage: true,
    mergeHeritage: false,
    import: `import { Model as MO } from "@/framework"`,
  },
  io: {
    mergeHeritage: false,
    // import * as I from "./iots"
    import: `import { IO_TS as I } from "@/framework"`,
  },
}
