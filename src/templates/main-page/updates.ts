import { askForums, squarespace, wiki } from "~/api";

export async function refresh() {
	const [documentOriginal, updates, blogPosts] = await Promise.all([
		wiki.getTemplateContent("MainPageUpdates"),
		askForums.getUpdates(),
		squarespace.getBlogPosts()
	]);

	const entries = [
		...updates.map(({ id, title, slug, created_at }) => ({
			at: new Date(created_at),
			id: `ask-${id}`,
			title: /developer.update/i.test(title) ? "Developer Update" : title,
			url: `https://ask.vrchat.com/t/${slug}/${id}`
		})),
		...blogPosts.map(({ id, title, fullUrl, publishOn }) => ({
			at: new Date(publishOn),
			id: `squ-${id}`,
			title,
			url: `https://hello.vrchat.com${fullUrl}`
		}))
	]
		.sort((a, b) => b.at.getTime() - a.at.getTime())
		.slice(0, 6);

	await wiki.saveTemplateContent(
		"MainPageUpdates",
		wiki.replace(
			documentOriginal,
			"items",
			entries
				.map(({ id, title, url, at }) =>
					wiki.template("MainPageUpdates/Item", {
						date: `@${Math.floor(at.getTime() / 1000)}`,
						id,
						title: wiki.translate(`Item title: ${id}`, title, true),
						url: wiki.translate(`Item url: ${id}`, url, true)
					})
				)
				.join("\n")
		),
		{
			previous: documentOriginal
		}
	);
}
