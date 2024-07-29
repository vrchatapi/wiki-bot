import { askForums, wiki } from "~/api";

export async function refresh() {
	const [documentOriginal, topics] = await Promise.all([
		wiki.getTemplateContent("MainPageUpdates"),
		askForums.getUpdates()
	]);

	const template = wiki.trimOnlyInclude(documentOriginal);
	const document = wiki.join(
		template,
		wiki.onlyInclude(
			template.replace(
				"{ask-forums-update-list}",
				topics
					.slice(0, 5)
					.map(
						(topic) =>
							`* [https://ask.vrchat.com/t/${topic.slug}/${topic.id} ${topic.title}]`
					)
					.join("\n")
			)
		)
	);

	await wiki.saveTemplateContent("MainPageUpdates", document);
}
