import { ExecutorContext } from "@nrwl/devkit";
import * as chalk from "chalk";
import * as cp from "child_process";

import {
	CompilationOptions,
	DisplayOptions,
	FeatureSelection,
	ManifestOptions,
	OutputOptions,
} from "./schema";

// prettier-ignore
type CargoOptions = Partial<
	& FeatureSelection
	& CompilationOptions
	& OutputOptions
	& DisplayOptions
	& ManifestOptions
> & {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;
};

export function parseArgs(opts: CargoOptions, ctx: ExecutorContext): string[] {
	let args = [] as string[];

	if (opts.toolchain) {
		args.push(`+${opts.toolchain}`);
	}

	// prettier-ignore
	switch (ctx.targetName) {
		case "build": args.push("build"); break;
		case "test":  args.push("test");  break;

		default: {
			if (ctx.targetName == null) {
				throw new Error("Expected target name to be non-null");
			} else {
				throw new Error(`Target '${ctx.targetName}' is invalid or not yet implemented`);
			}
		}
	}

	if (!ctx.projectName) {
		throw new Error("Expected project name to be non-null");
	}
	if (ctx.targetName === "build") {
		if (ctx.workspace.projects[ctx.projectName].projectType === "application") {
			args.push("--bin");
		} else {
			args.push("--lib");
		}
	} else {
		args.push("-p");
	}
	args.push(ctx.projectName);

	if (opts.features) {
		if (opts.features === "all") {
			args.push("--all-features");
		} else {
			args.push("--features", opts.features);
		}
	}

	if (opts.noDefaultFeatures) args.push("--no-default-features");
	if (opts.release) args.push("--release");
	if (opts.targetDir) args.push("--target-dir", opts.targetDir);
	if (opts.outDir) {
		if (args[0] !== "+nightly") {
			if (args[0].startsWith("+")) {
				let label = chalk.bold.yellowBright.inverse(" WARNING ");
				let original = args[0].replace(/^\+/, "");
				let message =
					`'outDir' option can only be used with 'nightly' toolchain, ` +
					`but toolchain '${original}' was already specified. ` +
					`Overriding '${original}' => 'nightly'.`;

				console.log(`${label} ${message}`);

				args[0] = "+nightly";
			} else {
				args.unshift("+nightly");
			}
		}
		args.push("-Z", "unstable-options", "--out-dir", opts.outDir);
	}
	if (opts.verbose) args.push("-v");
	if (opts.veryVerbose) args.push("-vv");
	if (opts.quiet) args.push("-q");
	if (opts.messageFormat) args.push("--message-format", opts.messageFormat);
	if (opts.locked) args.push("--locked");
	if (opts.frozen) args.push("--frozen");
	if (opts.offline) args.push("--offline");

	return args;
}

export function runCargo(args: string[], ctx: ExecutorContext) {
	console.log(chalk.dim(`> cargo ${args.join(" ")}`));

	return new Promise<void>((resolve, reject) => {
		cp.spawn("cargo", args, {
			cwd: ctx.root,
			shell: true,
			stdio: "inherit",
		})
			.on("error", reject)
			.on("close", code => {
				if (code) reject();
				else resolve();
			});
	});
}