# Valfaris
![valfaris](https://assets1.ignimgs.com/2019/11/07/valfaris---button-fin-1573155258335.jpg)!

Convert interfaces and type definitions to Morphic and io-ts definitions.
Careful, code is a prototype. May cause serious harm to eyes, including but not limited to: Eye bleeds.

## HOW TO USE

**Currently writes files to the specified path + .IO.ts and .MO.ts**

### Initial Setup

- `yarn`

### Everything

`yarn start /somewhere/some.interface.d.ts`

### Just some interfaces

`yarn start /somewhere/some.interface.d.ts Sometype SomeInterface someOthertype SomeOtherInterface`

## Notes

1. We currently do not follow imports.
   Make sure all necessary types are within the same file, or you will have to process each imported file separately

2. We currently do not fully sort the definitions.
   Make sure you re-order the them to follow proper variable definition rules of JS.

3. We currently do not support dynamic types, ie the ones generated from ReturnType<typeof SomeFunction>
   However you can generate d.ts files via `tsc` with enabled declarations option.
   you can then extract the definition from the function return signature into a Type or Interface.
   and then process the file with this tool.

## IDEAS

1. Ability to convert dynamic type definitions... ie, the ones generated from ReturnType<typeof someFunction>
   See Notes section for how to handle this.

2. improve ordering, not fix all cyclic issues, but reduce hassle to resolve them.

3. Only export if the type was exported in the original
