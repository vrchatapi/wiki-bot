import wretch from "wretch";

import { userAgent } from "~/environment";

import { cookie, log } from "./middleware";

import type { ConfiguredMiddleware } from "wretch";
import type { operations } from "discourse2/lib/schema";

const retry: ConfiguredMiddleware = (next) => async (url, options) => {
	const response = await next(url, options);
	if (response.status === 429) {
		const retryAfterValue = parseInt(response.headers.get("retry-after") ?? "", 10);
		const retryAfter = Number.isNaN(retryAfterValue) ? 10 : retryAfterValue;
		await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
		return next(url, options);
	}
	return response;
};

const base = wretch("https://ask.vrchat.com")
	.middlewares([log, retry, cookie])
	.headers({
		"user-agent": userAgent
	});

export async function getUpdates() {
	const {
		topic_list: { topics: officialTopics }
	} = await base
		.url("/c/official.json")
		.get()
		.json<
			operations["listCategoryTopics"]["responses"]["200"]["content"]["application/json"]
		>();

	const {
		topic_list: { topics: announcementTopics }
	} = await base
		.url("/c/71.json")
		.get()
		.json<
			operations["listCategoryTopics"]["responses"]["200"]["content"]["application/json"]
		>();

	return [...officialTopics, ...announcementTopics].sort(
		(a, b) =>
			new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
	);
}
