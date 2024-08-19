import { defaultSelfClosing, type UnknownElement } from "./elements";

export interface ParseOptions {
	selfClosing?: Array<string>;
}

export function toSyntaxTree(
	source: string,
	{ selfClosing = defaultSelfClosing }: ParseOptions = {}
): UnknownElement {
	let elementName = "";
	let value: string | undefined = undefined;
	let content = "";

	let isOpeningTag = false;
	let isClosingTag = false;
	let isContent = true;

	let isElementName = false;
	let isValue = false;

	let element: UnknownElement = { children: [], parent: null, type: "root" };
	const root = element;

	for (let index = 0; index < source.length; index++) {
		const character = source[index];

		if (character === "<") {
			if (content) element.children.push(content);

			if (source[index + 1] !== "/") {
				isOpeningTag = true;
				isContent = false;
				isElementName = true;
			} else {
				isClosingTag = true;
				isContent = false;
				isElementName = true;
			}

			elementName = "";
			value = undefined;
			content = "";

			continue;
		}

		if (isOpeningTag) {
			if (character === "=") {
				isElementName = false;
				isValue = true;

				value = "";

				continue;
			}

			if (character === ">") {
				if (selfClosing.includes(elementName)) {
					isOpeningTag = false;
					isContent = true;
					isElementName = false;
					isValue = false;

					element.children.push({
						children: [],
						parent: element,
						type: elementName,
						value
					});
					//element = element.children.at(-1) as UnknownElement;

					continue;
				}

				isOpeningTag = false;
				isContent = true;
				isElementName = false;
				isValue = false;

				element.children.push({
					children: [],
					parent: element,
					type: elementName,
					value
				});
				element = element.children.at(-1) as UnknownElement;

				continue;
			}

			if (isElementName) {
				elementName += character;
				continue;
			}

			if (isValue) {
				value += character;
				continue;
			}
		}

		if (isClosingTag) {
			if (character === ">") {
				isClosingTag = false;
				isElementName = false;
				isContent = true;

				element = element.parent || root;

				continue;
			}

			if (isElementName) {
				elementName += character;
				continue;
			}
		}

		if (isContent) {
			content += character;
		}
	}

	if (content) element.children.push(content);

	return root;
}
