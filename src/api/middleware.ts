import chalk from "chalk";

import type { ConfiguredMiddleware, WretchOptions } from "wretch";

export const log: ConfiguredMiddleware = (next) => {
	return async (url, options) => {
		const { origin } = new URL(url);
		console.log(options["method"], url.replace(origin, chalk.dim(origin)));
		const response = await next(url, options);

		console.log(
			options["method"],
			response.url.replace(origin, chalk.dim(origin)),
			response.status,
			response.statusText
		);
		return response;
	};
};

interface Cookies {
	all(): Promise<Record<string, Record<string, string>>>;
	all(url: string): Promise<Record<string, string>>;
	get(url: string, key: string): Promise<string | undefined>;
	set(url: string, key: string, value: string): Promise<void>;
	size(url: string): Promise<number>;
}

export const cookies: Cookies = {
	all: async (url?: string) => {
		const cookies = await Bun.file("cookies.json")
			.json()
			.catch(() => {});

		if (!url) return cookies ?? {};

		const { origin } = new URL(url);
		return cookies?.[origin] ?? {};
	},
	get: async (url: string, key: string) =>
		cookies.all(url).then((cookies) => cookies[key]),
	set: async (url: string, key: string, value: string) => {
		const allCookies = await cookies.all();

		const { origin } = new URL(url);
		allCookies[origin] ??= {};
		allCookies[origin][key] = value;

		await Bun.write("cookies.json", JSON.stringify(allCookies));
	},
	size: async (url: string) => Object.keys(await cookies.all(url)).length
};

export function serializeCookies(cookies: Record<string, string>): string {
	return Object.entries(cookies)
		.map(([key, value]) => `${key}=${value}`)
		.join("; ");
}

type CookieObject = Record<string, string>;

export function parseSetCookie(setCookie: string): CookieObject {
	return Object.fromEntries(
		setCookie
			.split(";", 1)
			.map((cookie) => cookie.trim().split("=", 2))
			.filter(([value]) => value.length > 0)
	);
}

export function parseSetCookies(setCookies: Array<string>): CookieObject {
	return setCookies
		.map((element) => parseSetCookie(element))
		.reduce((a, b) => ({ ...a, ...b }), {});
}

export const cookie: ConfiguredMiddleware = (next) => async (url, options) => {
	const allCookies = await cookies.all(url);
	const newOptions: WretchOptions = {
		...options,
		headers: {
			...options["headers"],
			cookie:
				Object.keys(allCookies).length > 0
					? serializeCookies(allCookies)
					: undefined
		}
	};

	const response = await next(url, newOptions);

	const changedCookies = parseSetCookies(response.headers.getSetCookie());
	if (Object.keys(changedCookies).length === 0) return response;

	for (const [key, value] of Object.entries(changedCookies)) {
		await cookies.set(url, key, value);
	}

	return response;
};
