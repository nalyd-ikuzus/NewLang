import { voidType, standardLibrary } from "./core.js"

export default function generate(program) {
    //Container for lines of target code, we'll join the lines with newlines at the end
    const output = []

    //Since we have different keywords, we'll add a numerical suffix to our var and func names
    const targetName = (mapping => {
      return entity => {
        if (!mapping.has(entity)) {
          mapping.set(entity, mapping.size + 1)
        }
        return `${entity.name}_${mapping.get(entity)}`
      }
    })(new Map())

    const gen = node => generators?.[node?.kind]?.(node) ?? node

    const generators = {
      Program(p) {
        p.statements.forEach(gen)
      },
      VariableDeclaration(d) {
        output.push(`let ${gen(d.variable)} = ${gen(d.initializer)};`)
      },
      FunctionDeclaration(d){
        output.push(`function ${gen(d.fun)}(${d.fun.params.map(gen).join(", ")}) {`)
        d.fun.body.forEach(gen)
        output.push("}")
      },
      Variable(v) {
        return targetName(v)
      },
      Function(f) {
        return targetName(f)
      },
      PrintStatement(s) {
        output.push(`console.log(${gen(s.argument)});`)
      },
      ReturnStatement(s) {
        if (s.expression.kind === "FunctionCall") {
          output.push(`return ${this.FunctionCall(s.expression, true)};`)
        } else {
          output.push(`return ${gen(s.expression)};`)
        }
      },
      ShortReturnStatement(s) {
        output.push("return;")
      },
      IfStatement(s) {
        output.push(`if (${gen(s.test)}) {`)
        s.consequent.forEach(gen)
        if (s.alternate.kind?.endsWith?.("IfStatement")) {
          output.push("} else")
          gen(s.alternate)
        } else {
          output.push("} else {")
          s.alternate.forEach(gen)
          output.push("}")
        }
      },
      ShortIfStatement(s) {
        output.push(`if (${gen(s.test)}) {`)
        s.consequent.forEach(gen)
        output.push("}")
      },
      BinaryExpression(e) {
        const op = { 
          "is": "===", 
          "unis": "!==", 
          "less": "<", 
          "lessis": "<=", 
          "more": ">", 
          "moreis": ">=",
          "plus": "+",
          "minus": "-",
          "divide": "/",
          "multiply": "*",
          "remain": "%",
          "exp": "**",
        }[e.op] ?? e.op
        return `(${gen(e.left)} ${op} ${gen(e.right)})`
      },
      UnaryExpression(e) {
        const operand = gen(e.operand)
        return `${e.op}(${operand})`
      },
      ListExpression(e) {
        return `[${e.elements.map(gen).join(",")}]`
      },
      SubscriptExpression(e) {
        return `${gen(e.list)}[${gen(e.index)}]`
      },
      FunctionCall(c, recursive=false) {
        const targetCode = `${gen(c.callee)}(${c.args.map(gen).join(", ")})`
        // Calls in expressions vs in statements are handled differently
        if (c.callee.type.returnType !== voidType || recursive) {
          return targetCode
        }

        output.push(`${targetCode}`)
      },

    }

    gen(program)
    return output.join("\n")
  }

