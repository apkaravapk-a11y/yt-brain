import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";

// A1: StrictMode only in dev — production runs single-mount for no double-effect flicker.
const tree = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

createRoot(document.getElementById("root")!).render(
  import.meta.env.DEV ? <StrictMode>{tree}</StrictMode> : tree,
);
