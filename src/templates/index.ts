import { relative } from "node:path";

import { Glob } from "bun";
import chalk from "chalk";

import { filter, filterGlob } from "~/environment";

const glob = new Glob("src/templates/**/*.ts");

export async function refreshTemplates() {
	const files = await Array.fromAsync(glob.scan("."));

	for await (const file of files) {
		const { refresh } = await import(file);
		if (!refresh) continue;

		const rel = relative("src/templates", file);
		if (!filterGlob.match(rel)) {
			console.warn(
				chalk.yellow(
					`refreshTemplates() => ${chalk.dim(`Ignoring "${rel}" because it doesn't match "${filter}".`)}`
				)
			);
			continue;
		}

		await refresh();
	}
}
