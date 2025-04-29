import {describe, it} from "node:test"
import assert from "node:assert/strict"
import parse from "../src/parser.js"
import analyze from "../src/analyzer.js"
import optimize from "../src/optimizer.js"
import generate from "../src/generator.js"

function dedent(s) {
    return `${s}`.replace(/(?<=\n)\s+/g, "").trim()
}

const fixtures = [
    {
        name: "assign",
        source: `
            newtext x is "Ignorance is strength"
            newnum y is 1
            newnum z is -1
            newlist w is [1, 2, 3]
        `,
        expected: dedent(`
            let x_1 = "Ignorance is strength";
            let y_2 = 1;
            let z_3 = -(1);
            let w_4 = [1,2,3];
        `)
    },
    {
        name: "conditional",
        source: `
            newbool thought is truth
            if thought is untruth {
                speak("Miniluv")
            } elif thought is truth {
                speak("Minitrue")
            }
        `,
        expected: dedent(`
            let thought_1 = true;
            if ((thought_1 === false)) {
                console.log("Miniluv");
            } else
                if ((thought_1 === true)) {
                    console.log("Minitrue");
                }
        `)
    },
    {
        name: "long conditional",
        source: `
            newnum x is 3
            if x is 0 {
                speak("zero")
            } elif x is 1 {
                speak("one")
            } elif x is 2 {
                speak("two")
            } else {
                speak("something else i'm not sure")
            }
        `,
        expected: dedent(`
            let x_1 = 3;
            if ((x_1 === 0)) {
                console.log("zero");
            } else
            if ((x_1 === 1)) {
                console.log("one");
            } else
            if ((x_1 === 2)) {
                console.log("two");
            } else {
                console.log("something else i'm not sure");
            }
        `)
    },
    {
        name: "short func",
        source: `
            newfunction shortReturn(x: int) : void { confess }
            shortReturn(1)
        `,
        expected: dedent(`
            function shortReturn_1(x_2) {
                return;
            }
            shortReturn_1(1)
        `)
    },
    {
        name: "confess",
        source: `
            newfunction longReturn(x: int) : int { confess x }
            speak(longReturn(51345))
        `,
        expected: dedent(`
            function longReturn_1(x_2) {
                return x_2;
            }
            console.log(longReturn_1(51345));
        `)
    },
    {
        name: "relops",
        source: `
            speak(1 lessis 2 and "x" more "y" and 3.5 less 1.2)
        `,
        expected: dedent(`
            console.log((((1 <= 2) && ("x" > "y")) && (3.5 < 1.2)));
        `)
    },
    {
        name: "or",
        source: `
            speak(truth or 1 less 2 or untruth)
        `,
        expected: dedent(`
            console.log(((true || (1 < 2)) || false));
        `)
    },
    {
        name: "and",
        source: `
            speak(truth and untruth and 1 less 2)
        `,
        expected: dedent(`
            console.log(((true && false) && (1 < 2)));
        `)
    },
    {
        name: "subscript",
        source: `
            newlist l is [1,2]
            speak(l[0])
        `,
        expected: dedent(`
            let l_1 = [1,2];
            console.log(l_1[0]);
        `)
    },
]

describe("The code generator", () => {
    for (const fixture of fixtures) {
        it(`produces expected js output for the ${fixture.name} program`, () => {
            const actual = generate(optimize(analyze(parse(fixture.source))))
            console.log("Expected: ", fixture.expected, "\nActual: ", actual)
            assert.deepEqual(actual, fixture.expected)
        })
    }
})

