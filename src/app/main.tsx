import { ErrorBoundary } from "@shared/ui";
import "@shared/lib/i18n";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@app/global.css";
import "@app/knowledge-editor.css";

document.addEventListener("contextmenu", (e) => {
	e.preventDefault();
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<ErrorBoundary>
			<App />
		</ErrorBoundary>
	</React.StrictMode>,
);
