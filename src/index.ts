import chalk from "chalk";

import { cookies } from "./api/middleware";
import { refreshTemplates } from "./templates";
import * as environment from "./environment";

if (environment.verbose) {
	console.warn(
		chalk.yellow("Verbose mode enabled, sensitive information will be logged."),
		{ cookies: await cookies.all(), environment }
	);
}

await refreshTemplates();
