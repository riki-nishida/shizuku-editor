import { createStore, Provider } from "jotai";
import type { ReactNode } from "react";

export const createTestWrapper = () => {
	const store = createStore();
	const Wrapper = ({ children }: { children: ReactNode }) => (
		<Provider store={store}>{children}</Provider>
	);
	return { Wrapper, store };
};
