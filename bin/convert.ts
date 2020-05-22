//import * as A from "fp-ts/lib/Array"

import { doIt } from "@/convert"

const rootTypes = process.argv.slice(3)

doIt(process.argv[2], rootTypes, (x) => x.name !== "___typename")
