import "@testing-library/jest-dom/vitest";
import i18n from "@shared/lib/i18n";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, vi } from "vitest";

beforeAll(() => {
	i18n.changeLanguage("ja");
});

afterEach(() => {
	cleanup();
});

vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
	ask: vi.fn(),
	message: vi.fn(),
	open: vi.fn(),
	save: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-store", () => ({
	Store: vi.fn().mockImplementation(() => ({
		get: vi.fn(),
		set: vi.fn(),
		save: vi.fn(),
		delete: vi.fn(),
	})),
}));
