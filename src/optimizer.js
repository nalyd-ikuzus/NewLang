import * as core from "./core.js"

/** 
 * Supported optimizations:
 *  - constant folding
*/

export default function optimize(node, recursive=false) {
    return optimizers?.[node.kind]?.(node, recursive) ?? node
  }

  const isZero = n => n === 0 || n === 0n
  const isOne = n => n === 1 || n === 1n

  const optimizers = {
    Program(p, _){
      p.statements = p.statements.flatMap(optimize)
      return p
    },
    VariableDeclaration(d, _) {
      d.variable = optimize(d.variable)
      d.initializer = optimize(d.initializer)
      return d
    },
    FunctionDeclaration(d, _){
      d.fun = optimize(d.fun)
      return d
    },
    Function(f, _) {
      if (f.body) f.body = f.body.flatMap(optimize)
      return f
    },
    PrintStatement(s, _) {
      s.argument = optimize(s.argument)
      return s
    },
    ReturnStatement(s, _) {
      s.expression = optimize(s.expression, true)
      return s
    },
    ShortReturnStatement(s, _) {
      return s
    },
    IfStatement(s, _) {
      s.test = optimize(s.test)
      s.consequent = s.consequent.flatMap(optimize)
      if (s.alternate?.kind?.endsWith?.("IfStatement")) {
        s.alternate = optimize(s.alternate)
      } else {
        s.alternate = s.alternate.flatMap(optimize)
      }
      if (s.test.constructor === Boolean) { //reduce if trues and if falses to the body that always runs
        return s.test ? s.consequent : s.alternate
      }
      return s
    },
    ShortIfStatement(s, _) {
      s.test = optimize(s.test)
      s.consequent = s.consequent.flatMap(optimize)
      if (s.test.constructor === Boolean) { //reduce if trues and if falses to the body that always runs
        return s.test ? s.consequent : []
      }
      return s
    },
    BinaryExpression(e, recursive=false) {
      e.op = optimize(e.op)
      if (e.left.kind === "FunctionCall") {
        e.left = optimize(e.left, recursive)
      } else {
        e.left = optimize(e.left)
      }
      if (e.right.kind === "FunctionCall") {
        e.right = optimize(e.right, recursive)
      } else {
        e.right = optimize(e.right)
      }
      if (e.op === "&&") {
        if (e.left === true) return e.right
        if (e.right === true) return e.left
        if (e.right === e.left) return e.left
      } else if (e.op === "||") {
        if (e.left === false) return e.right
        if (e.right === false) return e.left
        if (e.right === e.left) return e.left
      } else if ([Number, BigInt].includes(e.left.constructor)) {
        //Numeric constant folding
        if ([Number, BigInt].includes(e.right.constructor)) {
          if (e.op === "plus") return e.left + e.right
          if (e.op === "minus") return e.left - e.right
          if (e.op === "multiply") return e.left * e.right
          if (e.op === "divide") return e.left / e.right
          if (e.op === "exp") return e.left ** e.right
          if (e.op === "remain") return e.left % e.right
          if (e.op === "less") return e.left < e.right
          if (e.op === "lessis") return e.left <= e.right
          if (e.op === "is") return e.left === e.right
          if (e.op === "notis") return e.left !== e.right
          if (e.op === "more") return e.left > e.right
          if (e.op === "moreis") return e.left >= e.right
        }
        if (isZero(e.left) && e.op === "plus") return e.right
        if (isOne(e.left) && e.op === "multiply") return e.right
        if (isZero(e.left) && e.op === "minus") return core.unary("-", e.right)
        if (isOne(e.left) && e.op === "exp") return e.left
        if (isZero(e.left) && ["multiply", "divide"].includes(e.op)) return e.left
      } else if ([Number, BigInt].includes(e.right.constructor)) {
        if (["plus", "minus"].includes(e.op) && isZero(e.right)) return e.left
        if (["multiply", "divide"].includes(e.op) && isOne(e.right)) return e.left
        if (e.op === "multiply" && isZero(e.right)) return e.right
        if (e.op === "exp" && isZero(e.right)) return 1
      }
      return e
    },
    UnaryExpression(e, recursive=false) {
      e.op = optimize(e.op)
      if (e.operand.kind === "FunctionCall"){
        e.operand = optimize(e.operand, recursive)
      } else {
        e.operand = optimize(e.operand)
      }
      if (e.operand.constructor === Number) {
        if (e.op === "-") {
          return -e.operand
        }
      }
      return e
    },
    ListExpression(e, _) {
      e.elements = e.elements.map(optimize)
      return e
    },
    SubscriptExpression(e, _) {
      e.list = optimize(e.list)
      e.index = optimize(e.index)
      return e
    },
    FunctionCall(c, recursive=false) {
      if (!recursive){ //Don't keep doing this if a return statement is trying to optimize the call infinitely
        c.callee = optimize(c.callee)
        c.args = c.args.map(optimize)
      }
      return c
    },

  }