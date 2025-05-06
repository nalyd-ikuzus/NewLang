import { describe, it } from "node:test"
import assert from "node:assert/strict"
import optimize from "../src/optimizer.js"
import parse from "../src/parser.js"
import analyze from "../src/analyzer.js"
import * as core from "../src/core.js"

//Constants to help readability
const i = core.variable("x", false, core.intType)
const x = core.variable("x", false, core.floatType)
const a = core.variable("a", false, core.listType(core.intType))
const or = (...d) => d.reduce((x, y) => core.binary("||", x, y))
const and = (...d) => d.reduce((x, y) => core.binary("&&", x, y))
const less = (x, y) => core.binary("less", x, y)
const eq = (x, y) => core.binary("is", x, y)
const neg = x => core.unary("-", x)

const tests = [
    ["folds +", core.binary("plus", 5, 8), 13],
    ["folds -", core.binary("minus", 5n, 8n), -3n],
    ["folds *", core.binary("multiply", 5, 8), 40],
    ["folds /", core.binary("divide", 5, 8), 0.625],
    ["folds **", core.binary("exp", 5, 8), 390625],
    ["folds %", core.binary("remain", 5, 8), 5],
    ["folds <", core.binary("less", 5, 8), true],
    ["folds <=", core.binary("lessis", 5, 8), true],
    ["folds ===", core.binary("is", 5, 8), false],
    ["folds !==", core.binary("notis", 5, 8), true],
    ["folds >", core.binary("more", 5, 8), false],
    ["folds >=", core.binary("moreis", 5, 8), false],
    ["optimizes +0", core.binary("plus", x, 0), x],
    ["optimizes -0", core.binary("minus", x, 0), x],
    ["optimizes *1 for ints", core.binary("multiply", i, 1), i],
    ["optimizes *1 for floats", core.binary("multiply", x, 1), x],
    ["optimizes /1", core.binary("divide", x, 1), x],
    ["optimizes *0", core.binary("multiply", x, 0), 0],
    ["optimizes 0*", core.binary("multiply", 0, x), 0],
    ["optimizes 0/", core.binary("multiply", 0, x), 0],
    ["optimizes 0+ for floats", core.binary("plus", 0, x), x],
    ["optimizes 0+ for ints", core.binary("plus", 0n, i), i],
    ["optimizes 0-", core.binary("minus", 0, x), neg(x)],
    ["optimizes 1*", core.binary("multiply", 1, x), x],
    ["folds negation", core.unary("-", 8), -8],
    ["optimizes 1** for ints", core.binary("exp", 1n, i), 1n],
    ["optimizes 1** for floats", core.binary("exp", 1n, x), 1n],
    ["optimizes **0", core.binary("exp", x, 0), 1],
    ["optimizes 1** for ints", core.binary("exp", 1n, x), 1n],
    ["removes left false from ||", or(false, less(x, 1)), less(x, 1)],
    ["removes right false from ||", or(less(x, 1), false), less(x, 1)],
    ["removes left true from &&", and(true, less(x, 1)), less(x, 1)],
    ["removes right true from &&", and(less(x, 1), true), less(x, 1)],
    ["folds duplicate booleans (true and true)", and(true, true), true],
    ["folds duplicate booleans (false and false)", and(false, false), false],
    ["folds duplicate booleans (true or true)", or(true, true), true],
    ["folds duplicate booleans (false or false)", or(false, false), false],
    ["optimizes if true", core.ifStatement(true, [core.shortReturnStatement], []), [core.shortReturnStatement]],
    ["optimizes if false", core.ifStatement(false, [], [core.shortReturnStatement]), [core.shortReturnStatement]],
    ["optimizes short if true", core.shortIfStatement(true, [core.shortReturnStatement]), [core.shortReturnStatement]],
    ["optimizes short if false", core.shortIfStatement(false, [core.shortReturnStatement]), []],
]

describe("The optimizer", () => {
    for (const [scenario, before, after] of tests) {
        it(`${scenario}`, () => {
            assert.deepEqual(optimize(before), after)
        })
    }
})