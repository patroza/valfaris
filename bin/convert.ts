//import * as A from "fp-ts/lib/Array"

import { doIt } from "@/convert"

const rootTypes = process.argv.slice(2)
console.log(rootTypes)

doIt("./src/samples/simple.ts")
