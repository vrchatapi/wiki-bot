import { queryStringAddon } from "wretch/addons";
import wretch from "wretch";

import { cookie, log } from "./middleware";

const base = wretch("https://hello.vrchat.com")
	.addon(queryStringAddon)
	.middlewares([log, cookie])
	.query({
		format: "json"
	});

interface Item {
	id: string;
	publishOn: string;
	title: string;
	fullUrl: string;
}

export async function getBlogPosts() {
	const { items } = await base
		.url("/blog")
		.get()
		.json<{ items: Array<Item> }>();

	return items;
}
