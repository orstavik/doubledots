// import { Border } from "./shorts/Border.js";
// // import { Flex, FlexChild } from "./shorthands/Flex.js";

// const Types = [
//   Border,
//   // Flex,
// ];
// const ChildTypes = {
//   // Flex: FlexChild,
// };

// // const identifierMap = {};
// // for (let Type of Types) {
// //   for (let id of Type.identifiers) {
// //     if (identifierMap[id])
// //       console.warn(`$doll "${id}" has two types: ${identifierMap[id].Type.name} && ${Type.name}.`);
// //     identifierMap[id] = { Type, ChildType: ChildTypes[Type.name] };
// //   }
// // }

// export function identify(value) {
//   const firstWord = value.match(/[a-z]+/)?.[0];
//   if (firstWord) {
//     const Def = identifierMap[firstWord];
//     if (Def) {
//       if (value.includes("|") && !Def.ChildType)
//         throw new SyntaxError(`The type '${Def.Type.name}' doesn't support childValue: ${value}`);
//       return Def;
//     }
//   }
//   throw new SyntaxError("Unknown dollType: " + value);
// }