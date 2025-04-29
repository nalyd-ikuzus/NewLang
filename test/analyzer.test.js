import { describe, it } from "node:test"
import assert from "node:assert/strict"
import parse from "../src/parser.js"
import analyze from "../src/analyzer.js"
import { program, variableDeclaration, variable, binary, floatType } from "../src/core.js"

//Semantically correct programs
const semanticChecks = [
    ["variable declarations", 'newnum x is 1 \nnewbool y is untruth\nnewlist z is [1,2,3]'],
    ["optional variable declarations", 'newnum x is 1? \nnewbool y is untruth? \nnewtext z is "test"?'],
    ["variable declarations with unary ops", 'newnum x is -1 \nnewbool y is !untruth'],
    ["array types", 'newfunction arrayParam(x : int[]) : void {}'],
    ["short return", 'newfunction shortReturn(x: int) : void { confess }'],
    ["long return", 'newfunction longReturn(x: int) : int { confess x }'],
    ["return in nested if", 'newfunction nestedIf() : void {if truth {confess}}'],
    ["long if", 'if truth {speak(1)} else {speak(3)}'],
    ["else if", 'if truth {speak(1)} elif truth {speak(2)} else {speak(3)}'],
    ["else if chain", 'if truth {speak(1)} elif truth {speak(2)} elif truth {speak(3)} else {speak(4)}'],
    ["OR", 'speak(truth or 1 less 2 or untruth)'],
    ["AND", 'speak(truth and untruth and 1 less 2)'],
    ["relops", 'speak(1 lessis 2 and "x" more "y" and 3.5 less 1.2)'],
    ["equals", 'speak(1 is 2)'],
    ["arithmetic", 'speak(1 plus 1)'],
    ["exponentiation", 'speak(1 exp 1)'],
    ["variables", 'newnum x is 1 \nspeak(x plus 2)'],
    ["subscript", 'newlist l is [1,2] \nspeak(l[0])'],
    ["function call", 'newfunction speakInFunction() : void {speak("tada")} \nspeakInFunction()'],
    ["built in functions", 'speak(sin(1.0))\ndistance(1.0, 2.0)\ntwoMinutesHate()'],
    ["functions with lists", 'newfunction listHandler(x: int, y: int, z: int) : int[] {confess [x, y, z]}'],
    ["optional return type", 'newfunction optionalReturn(x : int) : int? {if x is 1 {confess 1} else {confess}}'],
    ["assignable optionals", 'newfunction optionalAssign(x : int?) : int? {confess x}'],
]

const semanticErrors = [
    ["undeclared id", 'speak(x)', /Identifier x not declared/],
    ["return outside function", 'confess', /Return can only appear in a function/],
    ["non-boolean short if test", 'if 1 {}', /Expected a boolean/],
    ["bad types for OR", 'if 1 or truth {}', /Expected a boolean/],
    ["bad types for AND", 'if 1 and truth {}', /Expected a boolean/],
    ["bad types for ==", 'speak(untruth is 5)', /All elements must have the same type/],
    ["bad types for !=", 'speak(untruth unis 5)', /All elements must have the same type/],
    ["bad types for +", 'speak(untruth plus 1)', /Expected a number or string/],
    ["bad types for -", 'speak(untruth minus 1)', /Expected a number/],
    ["bad types for *", 'speak(untruth multiply 1)', /Expected a number/],
    ["bad types for /", 'speak(untruth divide 1)', /Expected a number/],
    ["bad types for <", 'speak(untruth less 1)', /Expected a number or string/],
    ["bad types for >", 'speak(untruth more 1)', /Expected a number or string/],
    ["bad types for <=", 'speak(untruth lessis 1)', /Expected a number or string/],
    ["bad types for >=", 'speak(untruth moreis 1)', /Expected a number or string/],
    ["bad types for negation", 'speak(-truth)', /Expected a number/],
    ["bad types for not", 'speak(!1)', /Expected a boolean/],
    ["call of uncallable", 'newnum x is 1\nspeak(x())', /Call of non-function/],
    ["non-integer index", 'newlist x is [1, 2]\nspeak(x[truth])', /Expected an int/],
    ["too many args", 'newfunction tooManyArgs(x: int) : void {}\ntooManyArgs(1, 2)', /1 argument\(s\) required but 2 passed/],
    ["too few args", 'newfunction tooFewArgs(x: int) : void {}\ntooFewArgs()', /1 argument\(s\) required but 0 passed/],
    ["type error call to abs()", 'speak(abs(truth))', /Cannot assign a boolean to a float/],
    ["unwrapping non-optional", 'speak(1 ?? 3)', /Expected an optional/],
    ["unwrapping incorrect list types", 'newlist x is [1, 2]?\n x ?? [truth, untruth]', /Cannot assign a boolean\[\] to a int\[\]/],
    ["declaring wrong type", 'newtext x is truth', /Cannot assign a boolean to a string/],
]

describe("The analyzer", () => {
    for (const [scenario, source] of semanticChecks) {
        it(`recognizes ${scenario}`, () => {
            assert.ok(analyze(parse(source)))
        })
    }
    for (const [scenario, source, errorMessagePattern] of semanticErrors) {
        it(`throws on ${scenario}`, () => {
            assert.throws(() => analyze(parse(source)), errorMessagePattern)
        })
    }
    it("produces the expected representation for a trivial program", () => {
        console.log(analyze(parse("newnum x is 1.0 plus 2.2")))
        assert.deepEqual(
            analyze(parse("newnum x is 1.0 plus 2.2")),
            program([
                variableDeclaration(
                    variable("x", false, floatType),
                    binary("plus", 1.0, 2.2, floatType)
                ),
            ])
        )
    })
})