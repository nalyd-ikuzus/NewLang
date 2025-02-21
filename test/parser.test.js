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
  ["call in statement", "newnum x is 1;\nf(100);\nspeak(1);"],
  ["call in exp", "speak(5 multiply f(x, y, 2 multiply y));"],
  ["short if", "if truth { speak(1); }"],
  ["longer if", "if truth { speak(1); } else { speak(1); }"],
  ["even longer if", "if truth { speak(1); } elif untruth { speak(1);}"],
  ["ors can be chained", "speak(1 or 2 or 3 or 4 or 5);"],
  ["ands can be chained", "speak(1 and 2 and 3 and 4 and 5);"],
  ["bitwise ops", "return (1|2|3) + (4^5^6) + (7&8&9);"],
  ["relational operators", "speak(1 less 2 or 1 lessis 2 or 1 is 2 or 1 unis 2 or 1 moreis 2 or 1 more 2);"],
  ["arithmetic", "confess 2 multiply x plus 3 divide 5 minus -1 remain 7 ^ 3 ^ 3;"],
  ["boolean literals", "newbool x is untruth or truth"],
  ["all numeric literal forms", "speak(8 multiply 89.123 multiply 1.3E5 multiply 1.3E+5 multiply 1.3E-5);"],
  ["parentheses", "speak(83 multiply ((((((((-(13 divide 21))))))))) plus 1 minus 0);"],
  ["indexing array literals", "speak([1,2,3][1]);"],
  ["member expression on string literal", 'speak("speak(1)");'],
  ["non-Latin letters in identifiers", "newnum コンパイラ is 100"],
  ["a simple string literal", "speak('hello😉😬💀🙅🏽‍♀️—`');"],
  ["end of program inside comment", "speak(0); // yay"],
  ["comments with no text", "speak(1);//\nspeak(0);//"],
]

// Programs with syntax errors that the parser will detect
const syntaxErrors = [
  ["non-letter in an identifier", "let ab😭c = 2;", /Line 1, col 7:/],
  ["malformed number", "let x= 2.;", /Line 1, col 10:/],
  ["a float with an E but no exponent", "let x = 5E * 11;", /Line 1, col 10:/],
  ["a missing right operand", "print(5 -);", /Line 1, col 10:/],
  ["a non-operator", "print(7 * ((2 _ 3));", /Line 1, col 15:/],
  ["an expression starting with a )", "return );", /Line 1, col 8:/],
  ["a statement starting with expression", "x * 5;", /Line 1, col 3:/],
  ["an illegal statement on line 2", "print(5);\nx * 5;", /Line 2, col 3:/],
  ["a statement starting with a )", "print(5);\n)", /Line 2, col 1:/],
  ["an expression starting with a *", "let x = * 71;", /Line 1, col 9:/],
  ["negation before exponentiation", "print(-2**2);", /Line 1, col 10:/],
  ["mixing ands and ors", "print(1 && 2 || 3);", /Line 1, col 15:/],
  ["mixing ors and ands", "print(1 || 2 && 3);", /Line 1, col 15:/],
  ["associating relational operators", "print(1 < 2 < 3);", /Line 1, col 13:/],
  ["while without braces", "while true\nprint(1);", /Line 2, col 1/],
  ["if without braces", "if x < 3\nprint(1);", /Line 2, col 1/],
  ["while as identifier", "let for = 3;", /Line 1, col 5/],
  ["if as identifier", "let if = 8;", /Line 1, col 5/],
  ["unbalanced brackets", "function f(): int[;", /Line 1, col 18/],
  ["empty array without type", "print([]);", /Line 1, col 8/],
  ["random used like a function", "print(random(1,2));", /Line 1, col 15/],
  ["bad array literal", "print([1,2,]);", /Line 1, col 12/],
  ["empty subscript", "print(a[]);", /Line 1, col 9/],
  ["true is not assignable", "true = 1;", /Line 1, col 5/],
  ["false is not assignable", "false = 1;", /Line 1, col 6/],
  ["numbers cannot be subscripted", "print(500[x]);", /Line 1, col 10/],
  ["numbers cannot be called", "print(500(x));", /Line 1, col 10/],
  ["numbers cannot be dereferenced", "print(500 .x);", /Line 1, col 11/],
  ["no-paren function type", "function f(g:int->int) {}", /Line 1, col 17/],
  ["string lit with unknown escape", 'print("ab\\zcdef");', /col 11/],
  ["string lit with newline", 'print("ab\\zcdef");', /col 11/],
  ["string lit with quote", 'print("ab\\zcdef");', /col 11/],
  ["string lit with code point too long", 'print("\\u{1111111}");', /col 17/],
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