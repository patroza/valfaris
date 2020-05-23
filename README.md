# Valfaris

Convert interfaces and type definitions to Morphic and io-ts definitions.


## IDEAS

1. Ability to convert dynamic type definitions... ie, the ones generated from ReturnType<typeof someFunction>
   for now the way to work with them is to generate d.ts files for that project, and then converting the d.ts definitions!

2.a Support inheritance... e.g CmsData, either by doing a I.intersection, or by embedding the values directly.
2.b Support either modeling optional ? as union with undefined, or as T.intersection

3. improve ordering, not fix all cyclic issues, but reduce hassle to resolve them.


4. Only export if the type was exported in the original
