import { renderToStaticMarkup } from "react-dom/server";

import { Element, type RenderOptions, type UnknownElement } from "./elements";

import { toSyntaxTree } from ".";

function _toHTML(tree: UnknownElement, options?: RenderOptions): string {
	return renderToStaticMarkup(<Element node={tree} {...options} />);
}

export function toHTML(value: string, options?: RenderOptions): string {
	return _toHTML(
		toSyntaxTree(value, { selfClosing: options?.selfClosing }),
		options
	);
}
