import { refreshTemplates } from "./templates";

console.log({ argv: process.argv.slice(2) });

await refreshTemplates();
