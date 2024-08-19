import type { ElementFunction } from ".";

export const BoldElement: ElementFunction = ({ children }) => {
	return <strong>{children()}</strong>;
};
