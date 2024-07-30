import chalk from "chalk";
import wretch from "wretch";
import QueryStringAddon from "wretch/addons/queryString";
import FormDataAddon from "wretch/addons/formData";

import { cookie, log } from "./middleware";

const base = wretch("https://wiki.vrchat.com")
	.addon(QueryStringAddon)
	.addon(FormDataAddon)
	.middlewares([log, cookie])
	.query({
		assert: "bot"
	});

const api = base.url("/api.php");

interface Failure {
	error: { code: string; info: string };
}

type MaybeFailure<T> =
	| (T & { error: undefined })
	| ({ [K in keyof T]: undefined } & Failure);

export async function getCsrfToken() {
	const { query, error } = await api
		.query({
			action: "query",
			format: "json",
			meta: "tokens",
			type: "csrf"
		})
		.get()
		.json<
			MaybeFailure<{
				query: {
					tokens: {
						csrftoken: string;
					};
				};
			}>
		>();

	const token = query?.tokens?.csrftoken;
	if (!token || error)
		throw new Error(
			`wiki.getCsrfToken() => ${chalk.dim(error?.info || "Unknown error.")}`
		);

	return token;
}

export async function getContent(pathname: string) {
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
