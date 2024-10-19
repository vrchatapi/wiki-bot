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
		topic_list: { topics }
	} = await base
		.url("/c/official.json")
		.get()
		.json<
			operations["listCategoryTopics"]["responses"]["200"]["content"]["application/json"]
		>();

	return topics;
}
