import * as fs from "fs";
import * as ohm from "ohm-js";
import stringify from "graph-stringify";
import compile from "./compiler.js";


//"BIG BROTHER IS WATCHING"

const help = `NewLang compiler

Syntax: NewLang <filename> <outputType>

Prints to stdout according to <outputType>, which must be one of:

  parsed     a message that the program was matched ok by the grammar
  analyzed   the statically analyzed representation
  optimized  the optimized semantically analyzed representation
  js         the translation to JavaScript
`

async function compileFromFile(filename, outputType) {
  try {
    const buffer = fs.readFileSync(filename, "utf8")
    const compiled = compile(buffer.toString(), outputType)
    console.log(stringify(compiled, "kind") || compiled)
  } catch (e) {
    console.error(`\u001b[31m${e}\u001b[39m`)
    process.exitCode = 1
  }
}

if (process.argv.length !== 4) {
  console.log(help)
} else {
  compileFromFile(process.argv[2], process.argv[3])
}