// "union" only exists on BASTJ, not EBAST etc..
// Recommendation is to use the taggedUnion, but is harder.
import { AsOpaque, summonFor } from "@morphic-ts/batteries/lib/summoner-BASTJ"
export * from "@morphic-ts/batteries/lib/usage/utils"

export const { summon, tagged } = summonFor({})
export { AsOpaque }
