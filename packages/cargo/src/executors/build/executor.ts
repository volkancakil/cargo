import { ExecutorContext } from "@nx/devkit";

import { Target, parseCargoArgs, runCargo } from "../../common";
import CLIOptions from "./schema";

export default async function (opts: CLIOptions, ctx: ExecutorContext) {
	try {
		let [args, env] = opts.run
			? parseCargoArgs(Target.Run, opts, ctx)
			: parseCargoArgs(Target.Build, opts, ctx);

		await runCargo(args, ctx, env);

		return { success: true };
	} catch (err) {
		return {
			success: false,
			reason: err?.message,
		};
	}
}
