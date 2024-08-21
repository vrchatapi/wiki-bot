/* eslint-disable sort-keys/sort-keys-fix */
/* eslint-disable @typescript-eslint/no-explicit-any */
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

	const { content, embeddedLinkData, moreInfoLinks } = article as {
		content: Array<any>;
		embeddedLinkData: Array<any>;
		moreInfoLinks: Array<any>;
	};
	if (!Array.isArray(content)) return null;

	const links = moreInfoLinks
		.filter(({ command }) => command === "OpenURL")
		.map(({ name, parameters: [url] }) => ({ name, url }));

	return {
		title: name,
		image: imageUrl,
		content: renderToStaticMarkup(
			<>
				{imageUrl && (
					<img
						src={imageUrl}
						style={{
							borderRadius: "8px",
							display: "block",
							float: "right",
							marginLeft: "1em",
							width: "32%"
						}}
					></img>
				)}
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

					if ("imageUrl" in value)
						return (
							<img
								src={value.imageUrl}
								key={index}
								style={{
									borderRadius: "8px",
									margin: "1em 0",
									width: "100%"
								}}
							/>
						);
				})}
				{links.length > 0 && (
					<div
						style={{
							display: "flex",
							gap: ".5em",
							flexWrap: "wrap",
							marginTop: "2em"
						}}
					>
						{links.map(({ name, url }, index) => (
							<a
								key={index}
								href={url}
								className="icon-none"
								title={name}
								style={{
									display: "flex",
									padding: "1em 2em",
									backgroundColor: "var(--less-dark-grey)",
									color: "white",
									width: "fit-content",
									borderRadius: "8px"
								}}
							>
								{name}
							</a>
						))}
					</div>
				)}
			</>
		)
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
								"article-id": articleId,
								"article-title": article.title,
								"article-content": Buffer.from(
									normalizeVRChat(article.content)
								).toString("base64")
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
