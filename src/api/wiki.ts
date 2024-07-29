import chalk from "chalk";
import wretch from "wretch";
import QueryStringAddon from "wretch/addons/queryString";
import FormDataAddon from "wretch/addons/formData";

import { cookie, log } from "./middleware";

const base = wretch("https://wiki.vrchat.com")
	.addon(QueryStringAddon)
	.addon(FormDataAddon)
	.middlewares([log, cookie]);

const api = base.url("/api.php");

export async function getCsrfToken() {
	const output = await api
		.query({
			action: "query",
			format: "json",
			meta: "tokens",
			type: "csrf"
		})
		.get()
		.json<{
			query: {
				tokens: {
					csrftoken: string;
				};
			};
		}>();

	const token = output?.query?.tokens?.csrftoken;
	if (!token)
		throw new Error("wiki.getCsrfToken() => Couldn't retrieve CSRF token.");

	console.log(`wiki.getCsrfToken() => ${chalk.dim(token)}`);
	return token;
}

export async function getContent(pathname: string) {
	console.log(`wiki.getContent(${chalk.bold(pathname)})`);
	return base.url(`/wiki/${pathname}`).query({ action: "raw" }).get().text();
}

export interface SaveContentOptions {
	summary?: string;
}

export async function saveContent(
	pathname: string,
	content: string,
	{ summary = "Automated edit." }: SaveContentOptions = {}
) {
	const token = await getCsrfToken();

	const { error } = await api
		.formData({
			action: "edit",
			bot: "1",
			format: "json",
			summary,
			text: content,
			title: pathname,
			token
		})
		.post()
		.json<{ error?: { info: string } }>();

	if (error)
		throw new Error(
			`wiki.saveContent(${pathname}, ...) => ${chalk.dim(error?.info || "Unknown error.")}`
		);

	console.log(
		`wiki.saveContent(${chalk.bold(pathname)}, ...)\n${chalk.dim(content)}`
	);
}

export async function getTemplateContent(template: string) {
	return getContent(`Template:${template}`);
}

export async function saveTemplateContent(template: string, content: string) {
	return saveContent(`Template:${template}`, content);
}

export function join(...parts: Array<string>) {
	return parts.join("\n");
}

export function onlyInclude(content: string) {
	return `<onlyinclude>
${content.trim()}
</onlyinclude>`;
}

export function trimOnlyInclude(document: string) {
	return document.replace(/<onlyinclude>.+<\/onlyinclude>/gis, "").trim();
}
