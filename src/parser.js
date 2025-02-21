import * as fs from “fs”;
import * as ohm from “ohm-js”;
const grammar = ohm.grammer(fs.readFileSync(“src/newlang.ohm”, “utf8"));
export default function parse(sourceCodeFileName) {
  const sourceCode = fs.readFileSync(sourceCodeFileName, “utf8”);
  const match = grammar.match(sourceCode);
  if (match.failed()) {
    throw match.message;
  }
  return match;
}