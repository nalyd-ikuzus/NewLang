import * as core from "./core.js"



export default function analyze(match) {
    const grammar = match.matcher.grammar

    class Context {
      constructor({ parent = null, locals = new Map(), function: f = null }) {
        Object.assign(this, { parent, locals, function: f})
      }
      add(name, entity) {
        this.locals.set(name, entity)
      }
      Lookup(name) {
        return this.locals.get(name) ?? (this.parent && this.parent.Lookup(name))
      }
      static root() {
        return new Context({ locals: new Map(Object.entries(core.standardLibrary)) })
      }
      newChildContext(props) {
        return new Context({ ...this, ...props, parent: this, locals: new Map() })
      }
    }

    //Current context that we are tracking
    let context = Context.root()

    function must(condition, message, errorLocation) {
      if (!condition) {
        const prefix = errorLocation.at.source.getLineAndColumnMessage()
        throw new Error(`${prefix}${message}`)
      }
    }

    function mustNotAlreadyBeDeclared(name, at) {
      must(!context.Lookup(name), `Identifier ${name} already declared`, at)
    }

    function mustHaveBeenFound(entity, name, at) {
      must(entity, `Identifier ${name} not declared`, at)
    }

    function mustHaveNumericType(e, at) {
      const expectedTypes = [core.intType, core.floatType]
      must(expectedTypes.includes(e.type), "Expected a number", at)
    }

    function mustHaveNumericOrStringType(e, at) {
      const expectedTypes = [core.intType, core.floatType, core.stringType]
      must(expectedTypes.includes(e.type), "Expected a number or string", at)
    }

    function mustHaveBooleanType(e, at) {
      must(e.type === core.booleanType, "Expected a boolean", at)
    }

    function mustHaveIntegerType(e, at) {
      must(e.type === core.intType, "Expected an integer", at)
    }

    function mustHaveListType(e, at) {
      must(e.type?.kind === "ListType", "Expected a list", at)
    }

    function mustHaveAnOptionalType(e, at) {
      must(e.type?.kind === "OptionalType", "Expected an optional", at)
    }

    function mustAllHaveSameType(expressions, at) {
      if (expressions.length > 0) {
        const type = expressions[0].type
        for (const e of expressions) {
          must(e.type === type, "All elements must have the same type", at)
        }
      }
    }

    function mustBeAType(e, at) {
      let isBasicType
      if (e?.kind === "OptionalType") {
        isBasicType = /int|float|text|bool|void|any/.test(e.baseType)
      } else {
        isBasicType = /int|float|text|bool|void|any/.test(e)
      }
      const isCompositeType = /ListType|FunctionType/.test(e?.kind)
      must(isBasicType || isCompositeType, "Type expected", at)
    }

    function equivalent(t1, t2) {
      console.log(`${t1} and ${t2} got to assignable - not function types ${t1?.kind} of ${t1.baseType} and ${t2?.kind} of ${t2.baseType}`)
      return ( t1 === t2 ||
        (t1?.kind === "OptionalType" &&
        t2?.kind === "OptionalType" &&
        equivalent(t1.baseType, t2.baseType)) ||
        (t2?.kind === "OptionalType" &&
        equivalent(t1, t2.baseType)) ||
        (t1?.kind === "ListType" &&
        t2?.kind === "ListType" &&
        equivalent(t1.baseType, t2.baseType))
        )
    }

    function assignable(fromType, toType) {
      return (
        toType == core.anyType ||
         equivalent(fromType, toType)
      )
    }

    function typeDescription(type) {
      if (typeof type === "string") return type
      if (type.kind == "ListType") return `${typeDescription(type.baseType)}[]`
    }

    function mustBeAssignable(e, { toType: type }, at) {
      const prefix = at.at.source.getLineAndColumnMessage()
      console.log(`${prefix} Trying to assign ${typeDescription(e.type)} to ${typeDescription(type)}`)
      const source = typeDescription(e.type)
      const target = typeDescription(type)
      const message = `Cannot assign a ${source} to a ${target}`
      must(assignable(e.type, type), message, at)
    }

    function mustBeInAFunction(at) {
      must(context.function, "Return can only appear in a function", at)
    }

    function mustBeCallable(e, at) {
      must(e?.type.kind === "FunctionType", "Call of non-function", at)
    }

    function mustNotReturnAnything(f, at) {
      const returnsNothing = (f.type.returnType === core.voidType || 
      f.type.returnType?.kind === "OptionalType")
      must(returnsNothing, "Something should be returned", at)
    }

    function mustReturnSomething(f, at) {
      const returnsSomething = f.type.returnType !== core.voidType
      must(returnsSomething, "Cannot return a value from this function", at)
    }

    function mustBeReturnable(e, { from: f }, at) {
      mustBeAssignable(e, { toType: f.type.returnType }, at)
    }

    function mustHaveCorrectArgumentCount(argCount, paramCount, at) {
      const message = `${paramCount} argument(s) required but ${argCount} passed`
      must(argCount === paramCount, message, at)
    }

    //Builder
    const builder = grammar.createSemantics().addOperation("rep", {
      Program(statements) {
        return core.program(statements.children.map(s => s.rep()))
      },

      ReturnType_recurse(type) {
        return type.rep()
      },

      ReturnType_void(_void) {
        return core.voidType
      },

      Type_list(type, _brackets) {
        return core.listType(type.sourceString)
      },

      Type_optional(type, _questionmark) {
        return core.optionalType(type.sourceString)
      },

      Type_simple(type) { return type.sourceString },

      FunctionDefinition(_newfunc, id, _openparens, parameters, _closeparens, _colon, type, block) {
        mustNotAlreadyBeDeclared(id.sourceString, { at: id })
        const fun = core.fun(id.sourceString)
        context.add(id.sourceString, fun)

        context = context.newChildContext({ function: fun })
        fun.params = parameters.rep()

        const paramTypes = fun.params.map(param => param.type)
        const returnType = type.rep()
        console.log(`${fun.name} has return type: ${returnType}, which is a ${returnType?.kind} of ${returnType?.baseType}`)
        mustBeAType(returnType, { at: type })
        fun.type = core.functionType(paramTypes, returnType)

        console.log("Making a function: ", fun)

        fun.body = block.rep()

        context = context.parent

        
                
        return core.functionDeclaration(fun)
      },

      ParameterList(params) {
        return params.asIteration().children.map((p) => p.rep())
      },

      Parameter(id, _colon, type) {
        mustNotAlreadyBeDeclared(id.sourceString, id)
        const param = core.variable(id.sourceString, false, type.rep())
        context.add(id.sourceString, param)
        return param
      },

      VariableDeclaration_certain(TypeKeyword, id, _eq, exp) {
        mustNotAlreadyBeDeclared(id.sourceString, { at: id })
        const initializer = exp.rep()
        switch (TypeKeyword.sourceString) {
          case "newnum": { 
            mustHaveNumericType(initializer, { at: exp })
            break
          }
          case "newtext": {
            mustBeAssignable(initializer, { toType: core.stringType }, { at: exp})
            break
          }
          case "newbool": {
            mustHaveBooleanType(initializer, { at: exp })
            break
          }
          case "newlist": {
            mustHaveListType(initializer, { at: exp })
            break
          }
        }

        const variable = core.variable(id.sourceString, false, initializer.type)
        context.add(id.sourceString, variable)
        return core.variableDeclaration(variable, initializer)
      },

      VariableDeclaration_conditional(TypeKeyword, id, _eq, exp, _questionmark) {
        mustNotAlreadyBeDeclared(id.sourceString, { at: id })
        const initializer = exp.rep()
        switch (TypeKeyword.sourceString) {
          case "newnum": { 
            console.log("Making a newnum")
            mustHaveNumericType(initializer, { at: exp })
            break
          }
          case "newtext": {
            console.log("Making a newtext")
            mustBeAssignable(initializer, { toType: core.stringType }, { at: exp})
            break
          }
          case "newbool": {
            console.log("Making a newbool")
            mustHaveBooleanType(initializer, { at: exp })
            break
          }
          case "newlist": {
            console.log("Making a newlist")
            mustHaveListType(initializer, { at: exp })
            break
          }
        }

        const variable = core.variable(id.sourceString, false, core.optionalType(initializer.type))
        context.add(id.sourceString, variable)
        return core.variableDeclaration(variable, initializer)
      },

      IfStatement_long(_if, exp, block, elsepart) {
        const test = exp.rep()
        mustHaveBooleanType(test, { at: exp })
        context = context.newChildContext()
        const consequent = block.rep()
        context = context.parent
        const alternate = elsepart.rep()
        return core.ifStatement(test, consequent, alternate)
      },

      IfStatement_elif(_if, exp, block, elifpart) {
        const test = exp.rep()
        mustHaveBooleanType(test, { at: exp })
        context = context.newChildContext()
        const consequent = block.rep()
        context = context.parent
        const alternate = elifpart.rep()
        return core.ifStatement(test, consequent, alternate)
      },

      IfStatement_short(_if, exp, block) {
        const test = exp.rep()
        mustHaveBooleanType(test, { at: exp })
        context = context.newChildContext()
        const consequent = block.rep()
        context = context.parent
        return core.shortIfStatement(test, consequent)
      },

      ElseIfClause_long(_elif, exp, block, elsepart) {
        const test = exp.rep()
        mustHaveBooleanType(test, { at: exp })
        context = context.newChildContext()
        const consequent = block.rep()
        context = context.parent
        const alternate = elsepart.rep()
        return core.ifStatement(test, consequent, alternate)
      },

      ElseIfClause_chain(_elif, exp, block, elifpart) {
        const test = exp.rep()
        mustHaveBooleanType(test, { at: exp })
        context = context.newChildContext()
        const consequent = block.rep()
        context = context.parent
        const alternate = elifpart.rep()
        return core.ifStatement(test, consequent, alternate)
      },

      ElseClause(_else, block) {
        context = context.newChildContext()
        const consequent = block.rep()
        return consequent
      },

      Block(_openparens, statements, _closeparens) {
        // Just dealing with the list of statements instead of using a block node
        return statements.children.map(s => s.rep())
      },

      ExpressionStatement(exp) {
        return exp.rep()
      },

      SpeakStatement(_speak, exp) {
        const argument = exp.rep()
        return core.printStatement(argument)
      },

      ConfessStatement_long(confess, exp) {
        mustBeInAFunction({ at: confess })
        mustReturnSomething(context.function, { at: confess })
        const returnExpression = exp.rep()
        mustBeReturnable(returnExpression, { from: context.function }, { at: exp })
        return core.returnStatement(returnExpression)
      },

      ConfessStatement_short(confess) {
        mustBeInAFunction({ at: confess })
        mustNotReturnAnything(context.function, { at: confess })
        return core.shortReturnStatement
      },

      Expression(exp) {
        return exp.rep()
      },

      UnwrapExpr_unwrapelse(exp1, elseOp, exp2) {
        const [optional, op, alternate] = [exp1.rep(), elseOp.sourceString, exp2.rep()]
        mustHaveAnOptionalType(optional, { at: exp1 })
        mustBeAssignable(alternate, { toType: optional.type.baseType }, { at: exp2 })
        return core.binary(op, optional, alternate, optional.type)
      },

      OrExpr_compare(exp1, _ops, exps) {
        let left = exp1.rep()
        mustHaveBooleanType(left, { at: exp1 })
        for (let e of exps.children) {
          let right = e.rep()
          mustHaveBooleanType(right, { at: e })
          left = core.binary("||", left, right, core.booleanType)
        }
        return left
      },

      AndExpr_compare(exp1, _ops, exps) {
        let left = exp1.rep()
        mustHaveBooleanType(left, { at: exp1 })
        for (let e of exps.children) {
          let right = e.rep()
          mustHaveBooleanType(right, { at: e })
          left = core.binary("&&", left, right, core.booleanType)
        }
        return left
      },

      Comparison_compare(exp1, relop, exp2) {
        const [left, op, right] = [exp1.rep(), relop.sourceString, exp2.rep()]
        // Inequality operators can only be applied to numbers and strings
        if (["less", "lessis", "more", "moreis"].includes(op)) {
          mustHaveNumericOrStringType(left, { at: exp1 })
        }
        // equality operators can be applied to any two of the same type
        mustAllHaveSameType([left, right,], { at: relop })
        return core.binary(op, left, right, core.booleanType)
      },

      AddExpr_plus(exp1, addOp, exp2) {
        const [left, op, right] = [exp1.rep(), addOp.sourceString, exp2.rep()]
        //Addition allows for string concat
        mustHaveNumericOrStringType(left, { at: exp1 })
        //Still must be the same type though
        mustAllHaveSameType(left, right, { at: addOp })
        return core.binary(op, left, right, left.type)
      },

      AddExpr_minus(exp1, minusOp, exp2) {
        const [left, op, right] = [exp1.rep(), minusOp.sourceString, exp2.rep()]
        mustHaveNumericType(left, { at: exp1 })
        mustAllHaveSameType(left, right, { at: minusOp })
        return core.binary(op, left, right, left.type)
      },

      MulExpr_mulop(exp1, mulOp, exp2) {
        const [left, op, right] = [exp1.rep(), mulOp.sourceString, exp2.rep()]
        mustHaveNumericType(left, { at: exp1 })
        mustAllHaveSameType(left, right, { at: mulOp })
        return core.binary(op, left, right, left.type)
      },

      ExpExpr_power(exp1, powerOp, exp2) {
        const [left, op, right] = [exp1.rep(), powerOp.sourceString, exp2.rep()]
        mustHaveNumericType(left, { at: exp1 })
        mustAllHaveSameType(left, right, { at: powerOp })
        return core.binary(op, left, right, left.type)
      },

      UnaryExpr_unary(unaryOp, exp) {
        const [op, operand] = [unaryOp.sourceString, exp.rep()]
        let type
        if (op === "!") {
          mustHaveBooleanType(operand, { at: exp })
          type = core.booleanType
        } else if (op === "-") {
          mustHaveNumericType(operand, { at: exp })
          type = operand.type
        }
        return core.unary(op, operand, type)
      },

      PriExpr_paren(_openparens, exp, _closeparens) {
        return exp.rep()
      },

      PriExpr_call(exp, open, expList, _close) {
        const callee = exp.rep()
        mustBeCallable(callee, { at: exp })
        const exps = expList.asIteration().children
        const targetTypes = callee.type.paramTypes
        mustHaveCorrectArgumentCount(exps.length, targetTypes.length, { at: open })
        const args = exps.map((exp, i) => {
          const arg = exp.rep()
          mustBeAssignable(arg, { toType: targetTypes[i] }, { at: exp })
          return arg
        })
        return core.functionCall(callee, args)
      },

      PriExpr_index(exp1, _open, exp2, _close) {
        const [list, subscript] = [exp1.rep(), exp2.rep()]
        mustHaveListType(list, { at: exp1 })
        mustHaveIntegerType(subscript, { at: exp2 })
        return core.subscript(list, subscript)
      },

      PriExpr_id(id) {
        // Check if an id had been declared already
        const entity = context.Lookup(id.sourceString)
        mustHaveBeenFound(entity, id.sourceString, { at: id })
        return entity
      },

      PriExpr_number(n) {
        return n.rep()
      },

      List(open, elements, _close) {
        const contents = elements.asIteration().children.map((e) => e.rep())
        mustAllHaveSameType(contents, open)
        const elementType = contents.length > 0 ? contents[0].type : "any"
        console.log("Making list of basetype: ", elementType)
        return core.listExpression(contents, core.listType(elementType))
      },

      ident_ident(_first, _rest) {
        const entity = context.Lookup(this.sourceString)
        mustHaveBeenFound(entity, this.sourceString, { at: this })
        return entity
      },

      truth(_) {
        return true
      },

      untruth(_) {
        return false
      },

      numeral_int(_number) {
        return BigInt(this.sourceString)
      },

      numeral_float(_number, _point, _fraction, _e, _sign, _exponent) {
        return Number(this.sourceString)
      },

      String(_openQuote, _chars, _closeQuote) {
        return this.sourceString
      }
    })
    
    return builder(match).rep()
  }