import Parser from "./frontend/parser.ts";
import Environment from "./runtime/environment.ts";
import { evaluate } from "./runtime/interpreter.ts";
import { MK_NULL, MK_NUMBER, MK_BOOL } from "./runtime/values.ts";

repl();

async function repl() {
  const parser = new Parser();
  const env = new Environment();
  env.declareVar("true", MK_BOOL(true));
  env.declareVar("false", MK_BOOL(false));
  env.declareVar("null", MK_NULL());
  console.log("\nRepl v0.1");
  while (true) {
    const input = prompt("> ");

    if (!input || input.includes("exit")) {
      Deno.exit(1);
    }

    const program = parser.produceAST(input as string);
    const res = evaluate(program, env);
    console.log(res);
  }
}
