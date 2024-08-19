import type { ElementFunction } from ".";

export const SizeElement: ElementFunction = ({ value, children }) => {
	if (typeof value !== "string") return <>{children()}</>;

	return <span style={{ fontSize: value }}>{children()}</span>;
};
