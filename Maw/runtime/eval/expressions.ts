import {
  AssignmentExpr,
  BinaryExpr,
  CallExpr,
  Identifier,
  ObjectLiteral,
  ReturnStat,
  StringLiteral,
} from "../../frontend/ast.ts";
import Environment from "../environment.ts";
import { evaluate } from "../interpreter.ts";
import { BoolVal, FunctionValue, MK_NULL, NativeFnValue, NumberVal, ObjectVal, RuntimeVal } from "../values.ts";

function eval_numeric_binary_expr(
  left: NumberVal,
  right: NumberVal,
  operator: string
): NumberVal {
  switch (operator) {
    case "+":
      return { value: left.value + right.value, type: "number" };
    case "-":
      return { value: left.value - right.value, type: "number" };
    case "*":
      return { value: left.value * right.value, type: "number" };
    case "/":
      return { value: left.value / right.value, type: "number" };
    case "%":
      return { value: left.value % right.value, type: "number" };

  }
}

function eval_bool_binary_expr(
  left: NumberVal,
  right: NumberVal,
  operator: string
): BoolVal {
  switch (operator) {
    case "==":
      return { value: left.value === right.value, type: "boolean" };
    case ">=":
      return { value: left.value >= right.value, type: "boolean" };
    case "<=":
      return { value: left.value <= right.value, type: "boolean" };
    case "!=":
      return { value: left.value !== right.value, type: "boolean" };
    case "<":
      return { value: left.value < right.value, type: "boolean" };
    case ">":
      return { value: left.value > right.value, type: "boolean" };


  }
}

export function eval_binary_exrp(
  binop: BinaryExpr,
  env: Environment
): RuntimeVal {
  const leftHandSide = evaluate(binop.left, env);
  const rightHandSide = evaluate(binop.right, env);
  if (leftHandSide.type == "number" && rightHandSide.type == "number" && binop.operator !== '==' && binop.operator !== '>=' && binop.operator !== '<=' && binop.operator !== '!=' && binop.operator !== '>' && binop.operator !== '<') {
    return eval_numeric_binary_expr(
      leftHandSide as NumberVal,
      rightHandSide as NumberVal,
      binop.operator
    );
  }else if(leftHandSide.type == "number" && rightHandSide.type == "number"){
    return eval_bool_binary_expr(
      leftHandSide as NumberVal,
      rightHandSide as NumberVal,
      binop.operator
    );
  }

  return MK_NULL();
}

export function eval_identifier(
  ident: Identifier,
  env: Environment
): RuntimeVal {
  const val = env.lookupVar(ident.symbol);
  return val;
}

export function eval_assignment(
  node: AssignmentExpr,
  env: Environment
): RuntimeVal {
  if (node.assigne.kind !== "Identifier")
    throw `Invalid left hand side: ${JSON.stringify(node.assigne)}`;

  const varname = (node.assigne as Identifier).symbol;
  return env.assignVar(varname, evaluate(node.value, env));
}

export function eval_object_expr(
  obj: ObjectLiteral,
  env: Environment
): RuntimeVal {

  const object = { type: "object", properties: new Map()} as ObjectVal

  for (const {key, value} of obj.properties){
    
    const runtimeVal = (value == undefined) ? env.lookupVar(key) : evaluate(value, env)
    object.properties.set(key, runtimeVal);
  }

  return object;
}

export function eval_call_expr(
  expr: CallExpr,
  env: Environment
): RuntimeVal {

  const args = expr.args.map((arg)=> evaluate(arg, env))

  const fn = evaluate(expr.caller, env);

  if(fn.type == "native-fn"){
    const res = (fn as NativeFnValue).call(args, env)
  return res;
  }
  
  if(fn.type == "function"){
    const funct = fn as FunctionValue;
    const scope = new Environment(funct.declarationEnv);

    if(args.length !== funct.parameters.length){
      throw "Too many or to little arguments passed into a function when calling."
    }

    for(let i = 0; i < funct.parameters.length; i++){
      
      scope.declareVar(funct.parameters[i], args[i], false);
    }

    let result: RuntimeVal = MK_NULL();

    //this is where I can implement return 
    for(const stat of funct.body){
      if(stat.kind == "ReturnStat"){
        result = evaluate((stat as ReturnStat).right,scope)
        break;
      }
      evaluate(stat, scope)
    }

    return result;
  }

  throw "Cannot call value that is not a function: " + JSON.stringify(fn);
  
}