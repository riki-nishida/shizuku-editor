export default {
	"*.{js,ts,tsx,css}": "biome check --write --error-on-warnings",
	"*.json": (files) => {
		const filtered = files.filter((f) => !f.includes("src-tauri"));
		if (filtered.length === 0) return [];
		return `biome check --write --error-on-warnings ${filtered.join(" ")}`;
	},
};
