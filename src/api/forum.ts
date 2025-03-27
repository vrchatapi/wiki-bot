import wretch from "wretch";

import { userAgent } from "~/environment";

import { cookie, log } from "./middleware";

import type { operations } from "discourse2/lib/schema";

const base = wretch("https://ask.vrchat.com")
	.middlewares([log, cookie])
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
