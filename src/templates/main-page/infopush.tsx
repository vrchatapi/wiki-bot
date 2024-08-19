import { renderToStaticMarkup } from "react-dom/server";

import { normalizeVRChat } from "~/api/vrchat";

import { vrchat, wiki } from "../../api";
import * as richtext from "../../rich-text";

import type { InfoPushData } from "vrchat";

const supportedCommands = [
	"OpenURL",
	"OpenWorldsMenu",
	"OpenSafetyMenu",
	"OpenVRCPlusMenu",
	"OpenHelpArticle"
] as const;
type SupportedCommand = (typeof supportedCommands)[number];

function getArticle({ name, article, imageUrl }: InfoPushData) {
	if (!article) return null;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const { content, embeddedLinkData, moreInfoLinks } = article as any;
	if (!Array.isArray(content)) return null;

	return {
		content: renderToStaticMarkup(
			<>
				{content.map((value, index) => {
					if ("text" in value) {
						const tree = richtext.toSyntaxTree(value.text);
						return (
							<richtext.Element
								node={tree}
								key={index}
								errorStrategy="throw"
								elements={{
									...richtext.defaultElements,
									link: ({ value: id, children }) => {
										const item = embeddedLinkData.find(
											({ id: _id }) => _id === id
										);
										if (!item) return <>{children()}</>;

										const { command } = item;
										if (command !== "OpenURL") return <>{children()}</>;

										const {
											parameters: [url],
											name
										} = item;

										return (
											<a href={url} title={name}>
												{children()}
											</a>
										);
									},
									u: ({ children }) => <u>{children()}</u>
								}}
							/>
						);
					}
				})}
			</>
		),
		image: imageUrl,
		title: name
	};
}

export async function refresh() {
	const [documentOriginal, quickMenu, userAll] = await Promise.all([
		wiki.getTemplateContent("MainPageInfopush"),
		vrchat.getInfopush({
			include: ["user-all"],
			require: ["quick-menu-banner"]
		}),
		vrchat.getInfopush({
			include: ["user-all"],
			require: ["user-all"]
		})
	]);

	const data = quickMenu
		.filter(({ data }) => {
			if (!data.imageUrl) return false;
			if (!data.onPressed) return true;
			return supportedCommands.includes(
				data.onPressed.command as SupportedCommand
			);
		})
		.map(({ id, data: { imageUrl, onPressed } }) => ({
			id,
			image: imageUrl,
			...(onPressed
				? {
						OpenHelpArticle: (() => {
							const articleId = onPressed.parameters![0];

							const item = userAll.find(({ id }) => id === articleId);
							if (!item) return {};

							const { data } = item;
							const article = getArticle(data);
							if (!article) return {};

							return {
								"article-content": Buffer.from(
									normalizeVRChat(article.content)
								).toString("base64"),
								"article-id": articleId,
								"article-image": article.image,
								"article-title": article.title
							};
						})(),
						OpenSafetyMenu: {
							url: "https://wiki.vrchat.com/wiki/Trust_and_Safety"
						},
						OpenURL: { url: onPressed!.parameters![0] },
						OpenVRCPlusMenu: { url: "https://wiki.vrchat.com/wiki/VRChat+" },
						OpenWorldsMenu: {
							url: `https://vrchat.com/home/worlds#${onPressed!.parameters![0]}`
						}
					}[onPressed.command as SupportedCommand]
				: {})
		}));

	const template = wiki.trimOnlyInclude(documentOriginal);
	const document = wiki.join(
		template,
		wiki.onlyInclude(
			template
				.replace("{entries}", btoa(JSON.stringify({})))
				.replace(
					"{content}",
					data
						.map((item) => wiki.template("MainPageInfopush/Item", item))
						.join("\n")
				)
		)
	);

	await wiki.saveTemplateContent("MainPageInfopush", document, {
		previous: documentOriginal
	});
}
