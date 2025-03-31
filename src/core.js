// Core.js: Object representations for all nodes in NewLang.  Modified from "How To Write a Compiler" course notes

export function program(statements) {
    return { kind: "Program", statements }
}

export function variableDeclaration(variable, initializer) {
    return { kind: "VariableDeclaration", variable, initializer}
}

export const typeKeywords = {
    newnum : "num",
    newtext : "text",
    newbool : "bool",
    newlist : "list",
}

export function variable(name, mutable=false, type) {
    return { kind: "Variable", name, mutable, type }
}

export const booleanType = "boolean"
export const intType = "int"
export const floatType = "float"
export const numType = "num"
export const stringType = "string"
export const voidType = "void"
export const anyType = "any"

export function functionDeclaration(fun) {
    return { kind: "FunctionDeclaration", fun }
}

export function fun(name, params, body, type) {
    return { kind: "Function", name, params, body, type }
}

export function printStatement(argument) {
    return { kind: "PrintStatement", argument }
}

export function intrinsicFunction(name, type) {
    return { kind: "Function", name, type, intrinsic: true }
}

export function listType(baseType) {
    return { kind: "ListType", baseType }
}

export function functionType(paramTypes, returnType) {
    return { kind: "FunctionType", paramTypes, returnType }
}

export function optionalType(baseType) {
    return { kind: "OptionalType", baseType } //untested
}

export function returnStatement(expression) {
    return { kind: "ReturnStatement", expression }
}

export const shortReturnStatement = { kind: "ShortReturnStatement" }

export function ifStatement(test, consequent, alternate) {
    return { kind: "IfStatement", test, consequent, alternate }
}

export function shortIfStatement(test, consequent) {
    return { kind: "ShortIfStatement", test, consequent }
}

export function binary(op, left, right, type) {
    return { kind: "BinaryExpression", op, left, right, type}
}

export function unary(op, operand, type) {
    return { kind: "UnaryExpression", op, operand, type }
}

export function listExpression(elements, type) {
    return { kind: "ListExpression", elements, type }
}

// export function emptyOptional(baseType) {
//     return { kind: "EmptyOptional", baseType, type: optionalType(baseType) } //untested
// }

export function subscript(list, index) {
    return { kind: "SubscriptExpression", list, index, type: list.type.baseType }
}

// export function emptyListType(type) {
//     return { kind: "EmptyList", type } //untested
// }

export function functionCall(callee, args) {
    if (callee.intrinsic) {
        if (callee.type.returnType === voidType) {
            return { kind: callee.name.replace(/^\p{L}/u, c => c.toUpperCase()), args } //untested
        } else if (callee.type.paramTypes.length === 1) {
            return unary(callee.name, args[0], callee.type.returnType)
        } else {
            return binary(callee.name, args[0], args[1], callee.type.returnType) //untested
        }
    }
    return { kind: "FunctionCall", callee, args, type: callee.type.returnType}
}

// Local constants used to simplify the std library definitions
const floatToFloatType = functionType([floatType], floatType)
const floatFloatToFloatType = functionType([floatType, floatType], floatType)
const stringToIntsType = functionType([stringType], listType(intType))
const anyToVoidType = functionType([anyType], voidType)

export const standardLibrary = Object.freeze({
    int: intType,
    float: floatType,
    boolean: booleanType,
    string: stringType,
    void: voidType,
    any: anyType,
    speak: intrinsicFunction("print", anyToVoidType),
    sqrt: intrinsicFunction("sqrt", floatToFloatType),
    sin: intrinsicFunction("sin", floatToFloatType),
    cos: intrinsicFunction("cos", floatToFloatType),
    exp: intrinsicFunction("exp", floatToFloatType),
    ln: intrinsicFunction("ln", floatToFloatType),
    abs: intrinsicFunction("abs", floatToFloatType),
    distance: intrinsicFunction("distance", floatFloatToFloatType),
    twoMinutesHate: intrinsicFunction("hate", functionType("", voidType)),
})


/**
 * Copied from Toal's Notes: "
 * We want every expression to have a type property.  But we aren't creating
 * special entities for numbers, strings, and booleans; instead, we are just
 * using the JavaScript values for those.  Fortunately we can monkey patch the
 * JS classes for these to give us what we want."
 */
String.prototype.type = stringType
Number.prototype.type = floatType
BigInt.prototype.type = intType
Boolean.prototype.type = booleanType