import { execSync } from "child_process"
import fs from "fs"

import { singularize, camelize } from "inflected"
import ts, { SyntaxKind } from "typescript"

import { Ord, pipe, A, O } from "@/framework"

import sort from "./sort"

const config = {
  morphic: {
    //mergeHeritage: true,
    mergeHeritage: false,
  },
  io: {
    mergeHeritage: false,
  },
}

function makeFullName(names: Record<string, number>) {
  return (name: string) => {
    if (!names[name]) {
      names[name] = 0
    }
    const nam = names[name] ? names[name] : ""
    names[name]++

    const fullName = `${name}${nam}`
    return fullName
  }
}

export const doIt = (
  script: string,
  typesOnly: string[],
  filterFields = (_: string) => true
) => {
  const cfgFile = ts.findConfigFile(script, (fn) => fs.existsSync(fn))
  if (!cfgFile) {
    throw new Error("No TS config file found")
  }

  const cfg = ts.readConfigFile(cfgFile, (fn) => fs.readFileSync(fn, "utf-8"))
  const program = ts.createProgram([script], cfg.config)
  //var typeChecker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(script)
  const definitions: any[] = []

  function parseTypeLiteral(m: ts.TypeLiteralNode) {
    return {
      name: m.name.escapedText,
      type: ts.SyntaxKind[m.type.kind],
      members: m.type.members.map(parseMember).filter(Boolean).filter(filterFields),
    }
  }
  function makeElementType(m, name?: string) {
    return parseMember({ name: { escapedText: name }, type: m })
    // return m.kind === SyntaxKind.TypeLiteral
    //   ? {
    //       type: ts.SyntaxKind[m.kind],
    //       members: m.members.map(parseMember).filter(Boolean).filter(filterFields),
    //     }
    //   : m.kind === SyntaxKind.TypeReference
    //   ? {
    //       type: "TypeReference",
    //       reference: m.typeName.escapedText,
    //     }
    //   : { type: ts.SyntaxKind[m.kind], help: 1 }
  }
  function parseMember(m: ts.TypeElement) {
    const parsedMember = parseMember2(m)
    if (m.questionToken) {
      return {
        ...parsedMember,
        optional: true,
      }
      // return {
      //   name: m.name!.escapedText,
      //   type: "UnionType",
      //   types: [parsedMember, { type: "UndefinedKeyword" }],
      // }
    }
    return parsedMember
  }
  function parseMember2(m: ts.TypeElement) {
    if (ts.isArrayTypeNode(m.type)) {
      const name = m.name!.escapedText
      return {
        name,
        type: ts.SyntaxKind[m.type.kind],
        // TODO: support array of objects etc too
        elementType: makeElementType(
          m.type.elementType,
          pipe(name, singularize, camelize)
        ),
      }
    }
    if (ts.isTypeLiteralNode(m.type)) {
      return parseTypeLiteral(m)
    }
    if (ts.isTypeReferenceNode(m.type)) {
      if (
        m.type.typeName.escapedText === "Array" ||
        m.type.typeName.escapedText === "ReadonlyArray"
      ) {
        const firstTypeArg = m.type.typeArguments[0]
        const name = m.name.escapedText
        return {
          name,
          type: "ArrayType",
          // TODO: support array of objects etc too
          //elementType: parseMember(m.type.typeArguments[0])
          elementType: makeElementType(firstTypeArg, pipe(name, singularize, camelize)),
          // firstTypeArg.kind === SyntaxKind.TypeLiteral
          //   ? {
          //       type: ts.SyntaxKind[firstTypeArg.kind],
          //       members: firstTypeArg.members.map(parseMember).filter(Boolean).filter(filterFields),
          //     }
          //   : {
          //       type: "TypeReference",
          //       reference: firstTypeArg.typeName.escapedText,
          //     },
        }
      }
      //   throw new Error("not working")
      // Hardcode for GraphQL Codegen Maybe.
      if (m.type.typeName && m.type.typeName.escapedText === "Maybe") {
        const v = {
          name: m.name.escapedText,
          type: "TypeReference",
          external: true,
          //reference: m.type.qualifier.escapedText,
          typeArguments: m.type.typeArguments
            ? pipe(m.type.typeArguments, A.map(makeElementType))
            : [],
        }
        return {
          ...v,
          interpretation: {
            name: v.name,
            type: "UnionType",
            types: [v.typeArguments[0], { type: "NullKeyword" }],
          },
        }
      }

      return {
        name: m.name.escapedText,
        type: ts.SyntaxKind[m.type.kind],
        reference: m.type.typeName.escapedText,
      }
    }
    if (ts.isTypeOperatorNode(m.type)) {
      // ignore type ops for now
      //   console.log(m)
      //   throw new Error("boom")
      return parseMember({ name: m.name, type: m.type.type })
    }
    if (ts.isLiteralTypeNode(m.type)) {
      return {
        name: m.name.escapedText,
        type: ts.SyntaxKind[m.type.kind],
        literal: m.type.literal.text,
      }
    }

    if (ts.isUnionTypeNode(m.type)) {
      return {
        name: m.name.escapedText,
        type: ts.SyntaxKind[m.type.kind],
        types: pipe(m.type.types, A.map(makeElementType))
          .filter(Boolean)
          .filter(filterFields),
      }
    }

    if (ts.SyntaxKind[m.type.kind].endsWith("Keyword")) {
      return {
        name: m.name.escapedText,
        type: ts.SyntaxKind[m.type.kind],
        //rest: m
        //type: m.
      }
    }

    if (ts.SyntaxKind[m.type.kind] === "LastTypeNode") {
      //console.log("LAST TYPE NODE", m)
      const v = {
        name: m.name.escapedText,
        type: "TypeReference",
        external: true,
        reference: m.type.qualifier.escapedText,
        typeArguments: m.type.typeArguments
          ? pipe(m.type.typeArguments, A.map(makeElementType))
          : [],
      }
      // Hardcode for GraphQL Codegen Maybe.
      if (v.reference === "Maybe" && v.typeArguments.length) {
        return {
          ...v,
          interpretation: {
            name: v.name,
            type: "UnionType",
            types: [v.typeArguments[0], { type: "NullKeyword" }],
          },
        }
      }
      return v
      throw new Error("hm")
      return {
        name: m.name.escapedText,
        type: ts.SyntaxKind[m.type.kind],
        //rest: m
        //type: m.
      }
    }

    // if (ts.isLastType) {
    //     console.log(m)
    //     throw new Error("type op")
    //   }
    if (ts.isParenthesizedTypeNode(m.type)) {
      return makeElementType(m.type.type)
    }

    if (ts.isIntersectionTypeNode(m.type)) {
      return {
        name: m.name.escapedText,
        type: ts.SyntaxKind[m.type.kind],
        types: pipe(m.type.types, A.map(makeElementType))
          .filter(Boolean)
          .filter(filterFields),
      }
    }

    if (ts.isIndexedAccessTypeNode(m.type)) {
      const indexType = m.type.indexType.literal.text
      const map = {
        String: "StringKeyword",
        ID: "StringKeyword",
        Boolean: "BooleanKeyword",
        Int: "NumberKeyword",
        Float: "NumberKeyword",
        Date: "StringKeyword",
        DateTime: "StringKeyword", // "Date",
        JSON: "AnyKeyword", // unknown
        Time: "StringKeyword",
      }
      const mapped = map[indexType]
      if (mapped) {
        //return parseMember({ name: m.name, type: mapped })
        return {
          name: m.name.escapedText,
          type: mapped,
        }
      }
    }

    console.log("unknown", ts.SyntaxKind[m.type.kind], JSON.stringify(m, undefined, 2))
    throw new Error("y")

    // }
  }

  const processInterface = (node: ts.InterfaceDeclaration) => {
    //const container = identifiers.includes(name) ? foundNodes : unfoundNodes;
    //container.push([name, node]);

    const name = node.name.text

    let heritage = []
    if (node.heritageClauses && node.heritageClauses.length) {
      heritage = node.heritageClauses
        .flatMap((x) => x.types)
        .map((x) => x.expression.escapedText)
    }

    definitions.push({
      name,
      members: node.members.map(parseMember).filter(Boolean).filter(filterFields),
      heritage,
    })
  }

  const processType = (node: ts.TypeAliasDeclaration) => {
    //const container = identifiers.includes(name) ? foundNodes : unfoundNodes;
    //container.push([name, node]);

    const name = node.name.escapedText

    if (SyntaxKind[node.type.kind] === "TypeReference") {
      definitions.push({
        name,
        type: "alias",
        alias: node.type.typeName.escapedText,
      })
    } else if (SyntaxKind[node.type.kind] === "UnionType") {
      definitions.push({
        name,
        type: "union",
        union: {
          type: "UnionType",
          types: node.type.types
            .map((x) => parseMember({ type: x, name: { escapedText: undefined } }))
            .filter(Boolean)
            .filter(filterFields),
        },
      })
    } else {
      definitions.push({
        name,
        members: (node.type.members || [])
          .map(parseMember)
          .filter(Boolean)
          .filter(filterFields),
      })
    }
  }

  function processNode(node: ts.Node) {
    if (ts.isInterfaceDeclaration(node)) {
      return processInterface(node)
    }
    if (ts.isTypeAliasDeclaration(node)) {
      return processType(node)
    }

    if (ts.isEnumDeclaration(node)) {
      // TODO: only supports as string literal atm
      //console.log("Mmm", JSON.stringify(node, undefined, 2))
      const name = node.name.escapedText
      definitions.push({
        name,
        type: "enum",
        values: node.members.map((x) => ({
          name: x.name.escapedText,
          value: x.initializer.text,
        })),
      })
    }

    return null
  }

  sourceFile!.forEachChild(processNode)

  definitions.reverse()

  const buildMO = (cfg) => {
    const makeFullN = makeFullName({})
    const mo = {}
    const mapping = {}
    const used: string[] = []
    const edges: Array<[string, string]> = []
    let currentName = ""
    const recordIt = (dep: string) => edges.push([dep, currentName])

    const makeType = (m) => {
      const name = m.name || "Anon"
      switch (m.type) {
        case "StringKeyword":
          return "F.string()"
        case "NumberKeyword":
          return "F.number()"
        case "ArrayType":
          return `F.array(${makeType(m.elementType)})`
        case "TypeLiteral": {
          return `F.interface({${m.members.map(makeMember).join("\n")}}, "${makeFullN(
            name
          )}")`
        }

        case "TypeReference":
          const rootType = definitions.find((d) => d.name === m.reference)
          if (rootType) {
            used.push(m.reference)
            recordIt(m.reference)
          }
          if (m.external) {
            if (m.interpretation) {
              return makeType(m.interpretation)
            }
            return `${m.reference}(F)`
          }

          const mref = m.reference.toLowerCase()
          return rootType
            ? `${m.reference}(F)` // `F.recursive(() => ${m.reference}(F), "${m.reference}")`
            : `F.${mapping[mref] ?? mref}()`
        case "LiteralType":
          return `F.stringLiteral("${m.literal}")`

        case "BooleanKeyword":
          return "F.boolean()"

        // undefined and null are problematic as they dont exist in morphic
        // instead you have to use either F.nullable, or F.intersection([F.partial({ field: X })])
        case "UndefinedKeyword":
          return "F.undefined()"
        case "NullKeyword":
          return "F.null()"

        case "AnyKeyword":
          return "F.unknown()"

        case "UnionType":
          if (
            m.types.find(
              (x) => x.type === "UndefinedKeyword" || x.type === "NullKeyword"
            )
          ) {
            const filtered = m.types.filter(
              (x) => x.type !== "UndefinedKeyword" && x.type !== "NullKeyword"
            )
            if (filtered.length > 1) {
              return `F.nullable(${makeType({ ...m, types: filtered })})`
            } else {
              return `F.nullable(${makeType(filtered[0])})`
            }
          }

          const filtered = m.types.filter((x) => x.type === "LiteralType")
          if (filtered.length === m.types.length) {
            return `F.keysOf({ ${m.types
              .map((x) => `${x.literal}: null`)
              .join(", ")} })`
          }

          return `F.union([${m.types.map((x) => makeType(x))}], "${makeFullN(name)}")`

        case "IntersectionType":
          return `F.intersection([${m.types.map((x) => makeType(x))}], "${name}")`

        case "LastTypeNode":
          return "F.unknown() /* TODO */"

        default: {
          console.error("No idea", name, JSON.stringify(m, undefined, 2))
          throw new Error("unhandled node")

          return "F.something()"
        }
      }
    }

    const makeMember = (m) => {
      return `${m.name}: ${makeType({
        ...m,
        name: pipe(m.name, camelize),
      })},`
    }

    definitions.forEach((x) => {
      currentName = x.name
      if (x.type === "alias") {
        mo[
          x.name
        ] = `export const ${x.name} = ${x.alias}\nexport type ${x.name} = ${x.alias}`
      } else if (x.type === "union") {
        mo[x.name] = `export const ${x.name} = MO.summon((F) => ${makeType(x.union)})`
      } else if (x.type === "enum") {
        mo[x.name] = `export const ${
          x.name
        } = MO.summon((F) => F.keysOf({ ${x.values
          .map((x) => `${x.name}: null`)
          .join(", ")} }))`
      } else {
        const shouldIntersect = !cfg.mergeHeritage && x.heritage?.length
        const members = getMembers(cfg.mergeHeritage, x, used)

        const optionalMembers = members.filter((x) => x.optional)
        const requiredMembers = members.filter((x) => !x.optional)
        const type = `F.interface({
          ${requiredMembers
            .map((x) => makeMember(x) + (x.inherited ? " // " + x.inherited : ""))
            .join("\n")}
      }, "${x.name}${shouldIntersect ? "Core" : ""}")`

        const optionalType = optionalMembers.length
          ? `F.partial({
        ${optionalMembers
          .map((x) => makeMember(x) + (x.inherited ? " // " + x.inherited : ""))
          .join("\n")}
    }, "${x.name}${shouldIntersect ? "CoreO" : "O"}")`
          : null

        const makeIntersection = (types) =>
          `F.intersection([${types.join(", ")}], "${x.name}")`

        mo[x.name] = `const ${x.name}_ = MO.summon((F) => ${
          shouldIntersect
            ? makeIntersection(
                x.heritage
                  .map((x) => `${x}(F)`)
                  .concat([type])
                  .concat(optionalType ? [optionalType] : [])
              )
            : optionalType
            ? makeIntersection([type, optionalType])
            : type
        })
    export interface ${x.name} extends MO.AType<typeof ${x.name}_> {}
    export interface ${x.name}Raw extends MO.EType<typeof ${x.name}_> {}
    export const ${x.name} = MO.AsOpaque<${x.name}Raw, ${x.name}>()(${x.name}_)
    `
      }
    })

    const sortedEdges = sort(edges)
    return pipe(
      Object.keys(mo).filter(
        (x) => !typesOnly.length || typesOnly.includes(x) || used.includes(x)
      ),
      A.sort(order(sortedEdges)),
      A.map((x) => mo[x])
    )
  }

  const buildIO = (cfg) => {
    const mapping = { date: "DateFromISOString" }
    const makeFullN = makeFullName({})
    const used = []
    const edges: Array<[string, string]> = []
    let currentName = ""
    const recordIt = (dep: string) => edges.push([dep, currentName])

    const mo = {}
    const makeType = (m) => {
      const name = m.name || "Anon"
      switch (m.type) {
        case "StringKeyword":
          return "I.string"
        case "NumberKeyword":
          return "I.number"
        case "ArrayType":
          return `I.array(${makeType(m.elementType)})`
        case "TypeLiteral": {
          return `I.type({${m.members.map(makeMember).join("\n")}}, "${makeFullN(
            name
          )}")`
        }
        case "TypeReference":
          const rootType = definitions.find((d) => d.name === m.reference)
          if (rootType) {
            used.push(m.reference)
            recordIt(m.reference)
          }
          if (m.external) {
            if (m.interpretation) {
              return makeType(m.interpretation)
            }
            return `${m.reference}`
          }

          const mref = m.reference.toLowerCase()
          return rootType
            ? `${m.reference}` // `I.recursion("${m.reference}", () => ${m.reference})`
            : `I.${mapping[mref] ?? mref}`
        case "LiteralType":
          return `I.literal("${m.literal}")`

        case "BooleanKeyword":
          return "I.boolean"

        case "UndefinedKeyword":
          return "I.undefined"

        case "NullKeyword":
          return "I.null"

        case "AnyKeyword":
          return "I.unknown"

        case "UnionType":
          // don't have this in iots atm.
          // if (
          //   m.types.find(
          //     (x) => x.type === "UndefinedKeyword" || x.type === "NullKeyword"
          //   )
          // ) {
          //   const filtered = m.types.filter(
          //     (x) => x.type !== "UndefinedKeyword" && x.type !== "NullKeyword"
          //   )
          //   if (filtered.length > 1) {
          //     return `I.nullable(${makeType({ ...m, types: filtered })})`
          //   } else {
          //     return `I.nullable(${makeType(filtered[0])})`
          //   }
          // }
          const filtered = m.types.filter((x) => x.type === "LiteralType")
          if (filtered.length === m.types.length) {
            return `I.keyof({ ${m.types.map((x) => `${x.literal}: null`).join(", ")} })`
          }

          return `I.union([${m.types.map((x) => makeType(x))}], "${makeFullN(name)}")`

        case "IntersectionType":
          return `I.intersection([${m.types.map((x) => makeType(x))}], "${name}")`

        case "LastTypeNode":
          return "I.unknown /* TODO */"

        default: {
          console.error("No idea", name, JSON.stringify(m, undefined, 2))
          throw new Error("unhandled node")

          return "I.something"
        }
      }
    }
    const makeMember = (m) => {
      return `${m.name}: ${makeType(m)},`
    }
    definitions.forEach((x) => {
      currentName = x.name
      if (x.type === "alias") {
        mo[
          x.name
        ] = `export const ${x.name} = ${x.alias}\nexport type ${x.name} = ${x.alias}`
      } else if (x.type === "union") {
        mo[x.name] = `export const ${x.name} = ${makeType(x.union)}`
      } else if (x.type === "enum") {
        mo[x.name] = `export const ${x.name} = I.keyof({ ${x.values
          .map((x) => `${x.name}: null`)
          .join(", ")} })`
      } else {
        const shouldIntersect = !cfg.mergeHeritage && x.heritage?.length
        const members = getMembers(cfg.mergeHeritage, x, used)

        const optionalMembers = members.filter((x) => x.optional)
        const requiredMembers = members.filter((x) => !x.optional)
        const type = `I.type({
          ${requiredMembers
            .map((x) => makeMember(x) + (x.inherited ? " // " + x.inherited : ""))
            .join("\n")}
      }, "${x.name}${shouldIntersect ? "Core" : ""}")`

        const optionalType = optionalMembers.length
          ? `I.partial({
        ${optionalMembers
          .map((x) => makeMember(x) + (x.inherited ? " // " + x.inherited : ""))
          .join("\n")}
    }, "${x.name}${shouldIntersect ? "CoreO" : "O"}")`
          : null

        const makeIntersection = (types) =>
          `I.intersection([${types.join(", ")}], "${x.name}")`

        mo[x.name] = `const ${x.name}_ = ${
          shouldIntersect
            ? makeIntersection(
                x.heritage.concat([type]).concat(optionalType ? [optionalType] : [])
              )
            : optionalType
            ? makeIntersection([type, optionalType])
            : type
        }
        export const ${x.name}: I.Type<${x.name}, typeof ${x.name}_["_O"], typeof ${
          x.name
        }_["_I"]> = ${x.name}_
export interface ${x.name} extends I.TypeOf<typeof ${x.name}_> {}
    `
      }
    })
    const sortedEdges = sort(edges)
    return pipe(
      Object.keys(mo).filter(
        (x) => !typesOnly.length || typesOnly.includes(x) || used.includes(x)
      ),
      A.sort(order(sortedEdges)),
      A.map((x) => mo[x])
    )
  }

  const order = (edges: Array<string>): Ord.Ord<string> =>
    Ord.contramap((x: string) => {
      const a = pipe(
        edges,
        A.findIndex((u) => u === x),
        O.getOrElse(() => 1000)
      )
      return a
    })(Ord.ordNumber)

  function getMembers(mergeHeritage, x, used) {
    const r = {}
    const merge = (members, heritage: string[], root?: string) => {
      // TODO: multi level heritage :/
      heritage.forEach((x) => {
        const h = definitions.find((d) => d.name === x)
        return merge(h.members, h.heritage, h.name)
        // if (h.heritage && h.heritage.length) {

        // }
        // h.members.forEach((m) => (r[m.name] = { ...m, inherited: root }))
      })
      members.forEach((x) => (r[x.name] = { ...x, inherited: root }))
      return r
    }

    if (!mergeHeritage && x.heritage) {
      used.push(...x.heritage)
    }
    const members = mergeHeritage
      ? Object.values(merge(x.members, x.heritage))
      : x.members
    return members
  }
  const mo = buildMO(config.morphic)
  const io = buildIO(config.io)

  if (false) {
    console.log(`
  import * as I from "./iots"
  import * as MO from "./morphic"
\n\n`)
    console.log("\n\n//Morphic:\n")
    console.log(mo.join("\n\n"))

    console.log("\n\n//IO-TS:\n")
    console.log(io.join("\n\n"))
  }

  const ioF = script + ".IO.ts"
  const moF = script + ".MO.ts"
  fs.writeFileSync(ioF, `import * as I from "./iots"\n\n${io.join("\n\n")}`, "utf-8")
  fs.writeFileSync(
    moF,
    `import * as MO from "./morphic"\n\n${mo.join("\n\n")}`,
    "utf-8"
  )

  const files = [ioF, moF]
  execSync(`prettier --write ${files.join(" ")}`)
}
