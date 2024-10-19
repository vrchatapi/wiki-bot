import { askForums, squarespace, wiki } from "~/api";

export async function refresh() {
	const [documentOriginal, updates, blogPosts] = await Promise.all([
		wiki.getTemplateContent("MainPageUpdates"),
		askForums.getUpdates(),
		squarespace.getBlogPosts()
	]);

	const entries = [
		...updates.map(({ id: sourceId, title, slug, created_at }) => {
			const id = `ask-${sourceId}`;
			const type = /developer.update/i.test(title)
				? ("developer-update" as const)
				: ("unknown" as const);

			return {
				at: new Date(created_at),
				id,
				title,
				type,
				url: `https://ask.vrchat.com/t/${slug}/${sourceId}`
			};
		}),
		...blogPosts.map(({ id, title, fullUrl, publishOn }) => ({
			at: new Date(publishOn),
			id: `squ-${id}`,
			title,
			type: "unknown" as const,
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
				.map(({ id, type, title, url, at }) =>
					wiki.template("MainPageUpdates/Item", {
						date: `@${Math.floor(at.getTime() / 1000)}`,
						id,
						title: {
							"developer-update": wiki.template(
								`:Translations:Template:MainPageUpdates/Item title: Developer Update/${wiki.template("PAGELANGUAGE")}`
							),
							unknown: wiki.translate(`Item title: ${id}`, title, true)
						}[type],
						url
					})
				)
				.join("\n")
		),
		{
			previous: documentOriginal
		}
	);
}
