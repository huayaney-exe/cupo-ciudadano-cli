import type { ParsedArgs } from "../cli/foundation/argv.js";
import type { GlobalFlags } from "../cli/foundation/global-flags.js";
import type { Result } from "../core/output.js";

export type Ctx = { args: ParsedArgs; flags: GlobalFlags };
// biome-ignore lint: handlers return heterogeneous Result<T>; checked per command.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Handler = (ctx: Ctx) => Promise<Result<any>>;
