//import * as A from "fp-ts/lib/Array"

import { doIt } from "@/convert"

const rootTypes = process.argv.slice(3)
console.log(rootTypes)

doIt(process.argv[2], rootTypes)
