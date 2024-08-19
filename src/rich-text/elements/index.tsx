/* eslint-disable sort-keys/sort-keys-fix */
import { BoldElement } from "./bold";
import { ColorElement } from "./color";
import { RootElement } from "./root";
import { SizeElement } from "./size";
import { BreakElement } from "./break";
import { TextElement } from "./text";

export interface Element<T extends string> {
	type: T;
	parent: Element<string> | null;
	value?: unknown;
	children: Array<UnknownElement | string>;
}

export interface RenderOptions {
	elements?: ElementMap;
	selfClosing?: Array<string>;
	errorStrategy?: "throw" | "quiet";
}

export type ElementFunction = (
	node: Omit<UnknownElement, "children"> & {
		children: () => Array<JSX.Element>;
		options?: RenderOptions;
	}
) => JSX.Element;

export type ElementMap = Record<string, ElementFunction>;

export type UnknownElement = Element<string>;

export const defaultElements: ElementMap = {
	b: BoldElement,
	bold: BoldElement,
	br: BreakElement,
	color: ColorElement,
	root: RootElement,
	size: SizeElement,
	text: TextElement
};

export const defaultSelfClosing = ["br"];

export const Element: React.FC<
	{ node: UnknownElement | string } & RenderOptions
> = ({ node, elements = defaultElements, errorStrategy = "quiet" }) => {
	if (typeof node === "string")
		return elements["text"]({
			type: "text",
			value: node,
			parent: null,
			children: () => []
		});

	const props = {
		...node,
		options: {
			elements,
			errorStrategy
		},
		children: () => {
			if (!node.children || node.children.length === 0) return [];
			return node.children.map((node, index) => (
				<Element
					node={node}
					key={index}
					elements={elements}
					errorStrategy={errorStrategy}
				/>
			));
		}
	};

	const render = elements[node.type];

	if (!render) {
		if (errorStrategy === "throw")
			throw new ReferenceError(`Unknown element: ${node.type}`);

		return props.children();
	}

	return render(props);
};
