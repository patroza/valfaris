import ts, { SyntaxKind } from "typescript"
import fs from "fs"

const script = "./src/samples/simple.ts"

const cfg = ts.readConfigFile("./tsconfig.json", fn => fs.readFileSync(fn, "utf-8"))
var program = ts.createProgram(["src/samples/simple.ts"], cfg.config);
//var typeChecker = program.getTypeChecker();
var sourceFile = program.getSourceFile(script);
const definitions: any[] = []

const parseTypeLiteral = (m: ts.TypeLiteralNode) => ({
    name: m.name.escapedText,
    type: ts.SyntaxKind[m.type.kind],
    members: m.type.members.map(parseMember)
})
const makeElementType = (m) => m.kind === SyntaxKind.TypeLiteral ? {
    type: ts.SyntaxKind[m.kind],
    members: m.members.map(parseMember)
} : m.kind === SyntaxKind.TypeReference ? {
    type: "TypeReference",
    reference: m.typeName.escapedText
} : { type: ts.SyntaxKind[m.kind] }
const parseMember = (m: ts.TypeElement) => {

    if (ts.isArrayTypeNode(m.type)) {
        return {
            name: m.name.escapedText,
            type: ts.SyntaxKind[m.type.kind],
            // TODO: support array of objects etc too
            elementType: makeElementType(m.type.elementType)
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
                elementType: m.type.typeArguments[0].kind === SyntaxKind.TypeLiteral ? {
                    type: ts.SyntaxKind[m.type.typeArguments[0].kind],
                    members: m.type.typeArguments[0].members.map(parseMember)
                } : {
                        type: "TypeReference",
                        reference: m.type.typeArguments[0].typeName.escapedText
                    }
            }
        }
        return {
            name: m.name.escapedText,
            type: ts.SyntaxKind[m.type.kind],
            reference: m.type.typeName.escapedText
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
        members: node.members.map(parseMember)
    })
}

const processType = (node: ts.TypeAliasDeclaration) => {
    //const container = identifiers.includes(name) ? foundNodes : unfoundNodes;
    //container.push([name, node]);

    const name = node.name.escapedText
    //console.log([name, node])


    definitions.push({
        name,
        members: node.type.members.map(parseMember)
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

const names = {}

const buildMO = () => {
    const mo = []
    const makeMember = m => {
        const makeType = (m) => {
            const name = m.name || "Anon"
            switch (m.type) {
                case "StringKeyword": return "F.string()"
                case "NumberKeyword": return "F.number()"
                case "ArrayType": return `F.array(${makeType(m.elementType)})`
                case "TypeReference": return definitions.some(d => d.name === m.reference) ? `${m.reference}(F)` : `F.${m.reference.toLowerCase()}()`
                case "TypeLiteral": {
                    if (!names[name]) {
                        names[name] = 0
                    }
                    const nam = names[name] ? names[name] : ""
                    names[name]++
                    return `F.interface({${m.members.map(makeMember).join("\n")}}, "${name}${nam}")`
                }

                default: { return "F.something()" }
            }
        }
        return `${m.name}: ${makeType(m)},`
    }
    definitions.forEach(x => {
        mo.push(
            `const ${x.name} = summon((F) => F.interface({
    ${x.members.map(makeMember).join("\n")}
}, "${x.name}"))`)
    })
    return mo
}

console.log(buildMO().join("\n\n"))
