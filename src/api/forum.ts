import Discourse from "discourse2";

export const discourse = new Discourse("https://ask.vrchat.com");

export async function getUpdates() {
	console.log(`askForums.getUpdates()`);

	const {
		topic_list: { topics }
	} = await discourse.listCategoryTopics({ id: 31, slug: "official" });
	return topics;
}
