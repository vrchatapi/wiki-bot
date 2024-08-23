import chalk from "chalk";
import wretch from "wretch";
import QueryStringAddon from "wretch/addons/queryString";
import FormDataAddon from "wretch/addons/formData";

import {
	dry,
	mediawikiPassword,
	mediawikiUsername,
	verbose,
	force
} from "~/environment";

import { cookie, cookies, log, serializeCookies } from "./middleware";

const base = wretch("https://wiki.vrchat.com")
	.addon(QueryStringAddon)
	.addon(FormDataAddon)
	.middlewares([log, cookie])
	.query({
		assert: "bot"
	});

const api = base.url("/api.php").middlewares([
	(next) => async (url, options) => {
		const response = await next(url, options);
		const error = response.headers.get("mediawiki-api-error");

		if (error === "assertbotfailed" && options["credentials"] !== "none") {
			console.log(
				chalk.yellow(
					`mediawiki => ${chalk.dim("Bot assertion failed, re-authenticating...")}`
				)
			);

			if (!(await login()))
				throw new Error(
					`mediawiki => ${chalk.dim("Failed to re-authenticate.")}`
				);

			const { origin } = new URL(url);
			const allCookies = await cookies.all(origin);

			return next(url, {
				...options,
				headers: {
					...options["headers"],
					cookie:
						Object.keys(allCookies).length > 0
							? serializeCookies(allCookies)
							: undefined
				}
			});
		}

		return response;
	}
]);

interface Failure {
	error: { code: string; info: string };
}

type MaybeFailure<T> =
	| (T & { error: undefined })
	| ({ [K in keyof T]: undefined } & Failure);

export async function getToken(type: string) {
	const { query, error } = await api
		.query(
			{
				action: "query",
				format: "json",
				meta: "tokens",
				type
			},
			type === "login"
		)
		.get()
		.json<
			MaybeFailure<{
				query: {
					tokens: Record<`${string}token`, string>;
				};
			}>
		>();

	const token = query?.tokens[`${type}token`];
	if (!token || error)
		throw new Error(
			`mediawiki.getToken(${type}) => ${chalk.dim(error?.info || "Unknown error.")}`
		);

	if (verbose)
		console.log(`mediawiki.getToken(${type}) => ${chalk.dim(token)}`);
	return token;
}

export async function login(): Promise<boolean> {
	const token = await getToken("login");

	const { login, error } = await api
		.options({ credentials: "none" })
		.formData({
			action: "login",
			format: "json",
			lgname: mediawikiUsername,
			lgpassword: mediawikiPassword,
			lgtoken: token
		})
		.query({}, true)
		.post()
		.json<
			MaybeFailure<{
				login: {
					result: string;
					reason: string;
				};
			}>
		>();

	if (login?.result !== "Success" || error) {
		console.error(
			chalk.red(
				`mediawiki.login() => ${chalk.dim(error?.info || login?.reason || "Unknown error.")}`
			)
		);
		return false;
	}

	return true;
}

export async function getContent(pathname: string) {
	return base.url(`/wiki/${pathname}`).query({ action: "raw" }).get().text();
}

export interface SaveContentOptions {
	summary?: string;
	/**
	 * The previous content of the page, used to skip saving if the content hasn't changed.
	 */
	previous?: string;
}

export async function saveContent(
	pathname: string,
	content: string,
	{ summary = "Automated edit.", previous }: SaveContentOptions = {}
) {
	if (dry) {
		console.log(
			`${chalk.yellow(
				`mediawiki.saveContent(${pathname}, ...) => ${chalk.dim("Dry-run mode, skipping.")}`
			)}${verbose ? `\n${chalk.dim(content)}` : ""}`
		);
		return;
	}

	if (previous && previous.trim() === content.trim()) {
		if (!force) {
			console.log(
				`${chalk.yellow(
					`mediawiki.saveContent(${pathname}, ...) => ${chalk.dim("Content hasn't changed, skipping.")}`
				)}`
			);
			return;
		}

		console.log(
			`${chalk.yellow(
				`mediawiki.saveContent(${pathname}, ...) => ${chalk.dim("Content hasn't changed, but --force is enabled, saving anyway.")}`
			)}`
		);
	}

	const token = await getToken("csrf");

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
			`mediawiki.saveContent(${pathname}, ...) => ${chalk.dim(error?.info || "Unknown error.")}`
		);
}

export async function getTemplateContent(template: string) {
	return getContent(`Template:${template}`);
}

export async function saveTemplateContent(
	template: string,
	content: string,
	options?: SaveContentOptions
) {
	return saveContent(`Template:${template}`, content, options);
}

export function join(...parts: Array<string>) {
	return parts.join("\n");
}

type TemplateValue = string | number;

export function template(
	name: string,
	parameters: Record<string, TemplateValue | undefined> | Array<TemplateValue>
) {
	return `{{${name}${
		Array.isArray(parameters)
			? parameters.map((value) => `\n|${value}`).join("")
			: Object.entries(parameters)
					.filter(([, value]) => value !== undefined)
					.map(([key, value]) => `\n|${key}=${value}`)
					.join("")
	}
}}`;
}

export function translate(
	name: string,
	original: string,
	nowrap: boolean = true
) {
	return `<translate${nowrap ? " nowrap" : ""}><!--T:${name}--> ${original}</translate>`;
}

export function replace(source: string, key: string, value: string) {
	const regex = new RegExp(`<!--${key}:start-->(.+)<!--${key}:end-->`, "gims");
	const match = [...source.matchAll(regex)];

	let output = source;
	for (const [a, previous] of match) {
		output = output.replace(a, a.replace(previous, value));
	}

	return output;
}
