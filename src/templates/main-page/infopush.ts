import { vrchat, wiki } from "../../api";

const supportedCommands = [
	"OpenURL",
	"OpenWorldsMenu",
	"OpenSafetyMenu",
	"OpenVRCPlusMenu"
] as const;
type SupportedCommand = (typeof supportedCommands)[number];

export async function refresh() {
	const [documentOriginal, infopush] = await Promise.all([
		wiki.getTemplateContent("MainPageInfopush"),
		vrchat.getInfopush({
			include: ["user-all"],
			require: ["quick-menu-banner"]
		})
	]);

	const data = infopush
		.filter(({ data }) => {
			if (!data.imageUrl) return false;
			if (!data.onPressed) return true;
			return supportedCommands.includes(
				data.onPressed.command as SupportedCommand
			);
		})
		.map(({ id, data }) => {
			const { command, parameters = [] } = data.onPressed!;

			return {
				id,
				image: data.imageUrl,
				url: {
					OpenSafetyMenu: "https://wiki.vrchat.com/wiki/Trust_and_Safety",
					OpenURL: parameters[0],
					OpenVRCPlusMenu: "https://wiki.vrchat.com/wiki/VRChat+",
					OpenWorldsMenu: `https://vrchat.com/home/worlds#${parameters[0]}`
				}[command as SupportedCommand]
			};
		});

	const template = wiki.trimOnlyInclude(documentOriginal);
	const document = wiki.join(
		template,
		wiki.onlyInclude(
			template.replace("{entries}", btoa(JSON.stringify({}))).replace(
				"{content}",
				data
					.map(({ id, image, url }) =>
						wiki.template("MainPageInfopush/Item", {
							id,
							image,
							url
						})
					)
					.join("\n")
			)
		)
	);

	await wiki.saveTemplateContent("MainPageInfopush", document, {
		previous: documentOriginal
	});
}
