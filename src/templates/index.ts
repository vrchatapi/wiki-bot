import { Glob } from "bun";

const glob = new Glob("src/templates/**/*.ts");

export async function refreshTemplates() {
	const files = await Array.fromAsync(glob.scan("."));

	for await (const file of files) {
		const { refresh } = await import(file);
		if (!refresh) continue;

		await refresh();
	}
}
