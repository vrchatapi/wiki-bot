import type { ElementFunction } from ".";

export const RootElement: ElementFunction = ({ children }) => {
	return <>{children()}</>;
};
