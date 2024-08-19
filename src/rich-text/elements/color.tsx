import type { ElementFunction } from ".";

export const defaultColors = {
	aqua: "#00ffffff",
	black: "#000000ff",
	blue: "#0000ffff",
	brown: "#a52a2aff",
	cyan: "#00ffffff",
	darkblue: "#0000a0ff",
	fuchsia: "#ff00ffff",
	green: "#008000ff",
	grey: "#808080ff",
	lightblue: "#add8e6ff",
	lime: "#00ff00ff",
	magenta: "#ff00ffff",
	maroon: "#800000ff",
	navy: "#000080ff",
	olive: "#808000ff",
	orange: "#ffa500ff",
	purple: "#800080ff",
	red: "#ff0000ff",
	silver: "#c0c0c0ff",
	teal: "#008080ff",
	white: "#ffffffff",
	yellow: "#ffff00ff"
};

export type DefaultColorName = keyof typeof defaultColors;

export const ColorElement: ElementFunction = ({ value, children }) => {
	if (typeof value !== "string") return <>{children()}</>;

	const color = defaultColors[value as DefaultColorName] || value;
	return <span style={{ color }}>{children()}</span>;
};
