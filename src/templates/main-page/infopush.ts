import { vrchat, wiki } from "../../api";

const excludedIds = ["ips_37b26b47-c37f-4c94-8199-d520052e6ba3"];

export async function refresh() {
	const [documentOriginal, infopush] = await Promise.all([
		wiki.getTemplateContent("MainPageInfopush"),
		vrchat.getInfopush({
			include: ["quick-menu-banner"],
			require: ["quick-menu-banner"]
		})
	]);

	const data = Object.fromEntries(
		infopush
			.filter(
				({ id, data }) =>
					!excludedIds.includes(id) &&
					data.imageUrl &&
					(data.onPressed?.command === "OpenURL" || !data.onPressed)
			)
			.map(({ id, data }) => [
				id,
				{
					image: data.imageUrl,
					url:
						data.onPressed?.command === "OpenURL"
							? // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
								data.onPressed?.parameters?.[0]!
							: undefined
				}
			])
	);

	const template = wiki.trimOnlyInclude(documentOriginal);
	const document = wiki.join(
		template,
		wiki.onlyInclude(template.replace("{entries}", btoa(JSON.stringify(data))))
	);

	await wiki.saveTemplateContent("MainPageInfopush", document);
}
