import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import styles from "./styles/index.css";

// Inject styles into the webview document head
const style = document.createElement("style");
style.textContent = styles;
document.head.appendChild(style);

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root element");
const root = createRoot(container);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
