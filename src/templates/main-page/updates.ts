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

	const template = wiki.trimOnlyInclude(documentOriginal);
	const document = wiki.join(
		template,
		wiki.onlyInclude(
			template.replace(
				"{entries}",
				entries
					.map(
						({ title, url, at }) =>
							`* <span style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden; width: 100%; display: block;">${at.toLocaleDateString(
								"en-US",
								{
									day: "2-digit",
									month: "short"
								}
							)} - [${url} ${title.trim()}]</span>`
					)
					.join("\n")
			)
		)
	);

	await wiki.saveTemplateContent("MainPageUpdates", document);
}
