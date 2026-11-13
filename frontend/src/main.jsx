import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import Background3D from "./Background3D.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Background3D />
    <App />
  </StrictMode>,
);
