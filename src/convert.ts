import fs from "fs"

import ts, { SyntaxKind } from "typescript"

export const doIt = (script: string, typesOnly: any[]) => {
  const cfg = ts.readConfigFile("./tsconfig.json", (fn) => fs.readFileSync(fn, "utf-8"))
  const program = ts.createProgram(["src/samples/simple.ts"], cfg.config)
  //var typeChecker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(script)
  const definitions: any[] = []

  const parseTypeLiteral = (m: ts.TypeLiteralNode) => ({
    name: m.name.escapedText,
    type: ts.SyntaxKind[m.type.kind],
    members: m.type.members.map(parseMember),
  })
  const makeElementType = (m) =>
    m.kind === SyntaxKind.TypeLiteral
      ? {
          type: ts.SyntaxKind[m.kind],
          members: m.members.map(parseMember),
        }
      : m.kind === SyntaxKind.TypeReference
      ? {
          type: "TypeReference",
          reference: m.typeName.escapedText,
        }
      : { type: ts.SyntaxKind[m.kind] }
  const parseMember = (m: ts.TypeElement) => {
    if (ts.isArrayTypeNode(m.type)) {
      return {
        name: m.name.escapedText,
        type: ts.SyntaxKind[m.type.kind],
        // TODO: support array of objects etc too
        elementType: makeElementType(m.type.elementType),
      }
    }
    if (ts.isTypeLiteralNode(m.type)) {
      return parseTypeLiteral(m)
    }
    if (ts.isTypeReferenceNode(m.type)) {
      if (m.type.typeName.escapedText === "Array") {
        return {
          name: m.name.escapedText,
          type: "ArrayType",
          // TODO: support array of objects etc too
          //elementType: parseMember(m.type.typeArguments[0])
          elementType:
            m.type.typeArguments[0].kind === SyntaxKind.TypeLiteral
              ? {
                  type: ts.SyntaxKind[m.type.typeArguments[0].kind],
                  members: m.type.typeArguments[0].members.map(parseMember),
                }
              : {
                  type: "TypeReference",
                  reference: m.type.typeArguments[0].typeName.escapedText,
                },
        }
      }
      return {
        name: m.name.escapedText,
        type: ts.SyntaxKind[m.type.kind],
        reference: m.type.typeName.escapedText,
      }
    }
    return {
      name: m.name.escapedText,
      type: ts.SyntaxKind[m.type.kind],
      //rest: m
      //type: m.
    }
    // }
  }

  const processInterface = (node: ts.InterfaceDeclaration) => {
    //const container = identifiers.includes(name) ? foundNodes : unfoundNodes;
    //container.push([name, node]);

    const name = node.name.text
    //console.log([name, node])

    definitions.push({
      name,
      members: node.members.map(parseMember),
    })
  }

  const processType = (node: ts.TypeAliasDeclaration) => {
    //const container = identifiers.includes(name) ? foundNodes : unfoundNodes;
    //container.push([name, node]);

    const name = node.name.escapedText
    //console.log([name, node])

    definitions.push({
      name,
      members: node.type.members.map(parseMember),
    })
  }

  sourceFile!.forEachChild(function (node) {
    if (ts.isInterfaceDeclaration(node)) {
      return processInterface(node)
    }
    if (ts.isTypeAliasDeclaration(node)) {
      return processType(node)
    }
  })

  definitions.reverse()

  const buildMO = () => {
    const names = {}
    const mo = {}
    const used: string[] = []
    const makeMember = (m) => {
      const makeType = (m) => {
        const name = m.name || "Anon"
        switch (m.type) {
          case "StringKeyword":
            return "F.string()"
          case "NumberKeyword":
            return "F.number()"
          case "ArrayType":
            return `F.array(${makeType(m.elementType)})`
          case "TypeReference":
            const rootType = definitions.find((d) => d.name === m.reference)
            if (rootType) {
              used.push(m.reference)
              console.log("used", used, m.reference)
            }
            return rootType ? `${m.reference}(F)` : `F.${m.reference.toLowerCase()}()`
          case "TypeLiteral": {
            if (!names[name]) {
              names[name] = 0
            }
            const nam = names[name] ? names[name] : ""
            names[name]++
            return `F.interface({${m.members
              .map(makeMember)
              .join("\n")}}, "${name}${nam}")`
          }

          default: {
            return "F.something()"
          }
        }
      }
      return `${m.name}: ${makeType(m)},`
    }
    console.log("$$$M", typesOnly, used)

    definitions.forEach((x) => {
      mo[x.name] = `const ${x.name}_ = MO.summon((F) => F.interface({
    ${x.members.map(makeMember).join("\n")}
}, "${x.name}"))
export interface ${x.name} extends MO.AType<typeof ${x.name}_> {}
export interface ${x.name}Raw extends MO.EType<typeof ${x.name}_> {}
export const ${x.name} = MO.AsOpaque<${x.name}Raw, ${x.name}>()(${x.name}_)
`
    })
    return Object.keys(mo)
      .filter((x) => !typesOnly.length || typesOnly.includes(x) || used.includes(x))
      .map((x) => mo[x])
  }

  const buildIO = () => {
    const mapping = { date: "DateFromISOString" }
    const used = []
    const mo = {}
    const makeMember = (m) => {
      const makeType = (m) => {
        const name = m.name || "Anon"
        switch (m.type) {
          case "StringKeyword":
            return "I.string"
          case "NumberKeyword":
            return "I.number"
          case "ArrayType":
            return `I.array(${makeType(m.elementType)})`
          case "TypeReference":
            const rootType = definitions.find((d) => d.name === m.reference)
            if (rootType) {
              used.push(m.reference)
              console.log("used", used, m.reference)
            }
            const mref = m.reference.toLowerCase()
            return rootType ? `${m.reference}` : `I.${mapping[mref] ?? mref}`
          case "TypeLiteral": {
            // if (!names[name]) {
            //     names[name] = 0
            // }
            // const nam = names[name] ? names[name] : ""
            // names[name]++
            return `I.type({${m.members.map(makeMember).join("\n")}})`
          }

          default: {
            return "I.something"
          }
        }
      }
      return `${m.name}: ${makeType(m)},`
    }
    console.log("$$$M", typesOnly, used)
    definitions.forEach((x) => {
      mo[x.name] = `
export const ${x.name} = I.type({
    ${x.members.map(makeMember).join("\n")}
})
export interface ${x.name} extends I.TypeOf<typeof ${x.name}> {}
`
    })
    return Object.keys(mo)
      .filter((x) => !typesOnly.length || typesOnly.includes(x) || used.includes(x))
      .map((x) => mo[x])
  }

  console.log("\n\nMorphic:\n")
  console.log(buildMO().join("\n\n"))

  console.log("\n\nIO-TS:\n")
  console.log(buildIO().join("\n\n"))
}
