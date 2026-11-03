import { main } from "./cli.js";

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (err) => {
    process.stderr.write(`idrd: error inesperado: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exitCode = 1;
  },
);
