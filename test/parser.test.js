import { describe, it } from "node:test"
import assert from "node:assert/strict"
import parse from "../src/parser.js"

// Programs expected to be syntactically correct
const syntaxChecks = [
  ["simplest syntactically correct program", "confess;"],
  ["multiple statements", "speak(1);\n confess; confess;"],
  ["variable declarations", "newbool test is truth\nnewnum i is 1"],
  ["function with no params, no return type", "newfunction f() {}"],
  ["function with one param", "newfunction f (x) {}"],
  ["function with two params", "newfunction f (x, y) {}"],
  ["call in statement", "newnum x is 1\nf(100);\nspeak(1);"],
  ["call in exp", "speak(5 multiply f(x, y, 2 multiply y));"],
  ["short if", "if truth { speak(1); }"],
  ["longer if", "if truth { speak(1); } else { speak(1); }"],
  ["even longer if", "if truth { speak(1); } elif untruth { speak(1);}"],
  ["ors can be chained", "speak(1 or 2 or 3 or 4 or 5);"],
  ["ands can be chained", "speak(1 and 2 and 3 and 4 and 5);"],
  ["relational operators", "speak(1 less 2 or 1 lessis 2 or 1 is 2 or 1 unis 2 or 1 moreis 2 or 1 more 2);"],
  ["arithmetic", "confess 2 multiply x plus 3 divide 5 minus -1 remain 7 ^ 3 ^ 3;"],
  ["boolean literals", "newbool x is untruth or truth"],
  ["all numeric literal forms", "speak(8 multiply 89.123 multiply 1.3E5 multiply 1.3E+5 multiply 1.3E-5);"],
  ["parentheses", "speak(83 multiply ((((((((-(13 divide 21))))))))) plus 1 minus 0);"],
  ["indexing array literals", "speak([1,2,3][1]);"],
  ["member expression on string literal", 'speak("speak(1)");'],
  ["non-Latin letters in identifiers", "newnum コンパイラ is 100"],
  ["a simple string literal", 'speak("hello😉😬💀🙅🏽‍♀️—`");'],
  ["end of program inside comment", "speak(0); // yay"],
  ["comments with no text", "speak(1);//\nspeak(0);//"],
]

// Programs with syntax errors that the parser will detect
const syntaxErrors = [
  ["non-letter in an identifier", "newnum ab😭c is 2;", /Line 1, col 10:/],
  ["malformed number", "newnum x is 2.", /Line 1, col 15:/],
  //["a float with an E but no exponent", "newnum x is 5E multiply 11", /Line 1, col 10:/],
  ["a missing right operand", "speak(5 -);", /Line 1, col 9:/],
  ["a non-operator", "speak(7 multiply ((2 _ 3));", /Line 1, col 22:/],
  ["an expression starting with a )", "confess );", /Line 1, col 9:/],
  //["a statement starting with expression", "x multiply 5;", /Line 1, col 3:/],
  ["an illegal statement on line 2", "speak(5);\nconfess );", /Line 2, col 9:/],
  ["a statement starting with a )", "speak(5);\n)", /Line 2, col 1:/],
  ["an expression starting with a *", "newnum x is multiply 71", /Line 1, col 13:/],
  ["associating relational operators", "print(1 < 2 < 3);", /Line 1, col 9:/],
  ["if as identifier", "newnum if is 8;", /Line 1, col 8/],
  ["unbalanced brackets", "newfunction f () {", /Line 1, col 19/],
  ["bad array literal", "newlist test is [1,2,]", /Line 1, col 22/],
  ["numbers cannot be subscripted", "speak(500[x]);", /Line 1, col 10/],
  ["numbers cannot be called", "speak(500(x));", /Line 1, col 10/],
]

describe("The parser", () => {
  for (const [scenario, source] of syntaxChecks) {
    it(`matches ${scenario}`, () => {
      assert(parse(source).succeeded())
    })
  }
  for (const [scenario, source, errorMessagePattern] of syntaxErrors) {
    it(`throws on ${scenario}`, () => {
      assert.throws(() => parse(source), errorMessagePattern)
    })
  }
})