import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AudioGallery } from "./AudioGallery";

const root = document.getElementById("root");
if (root === null) throw new Error("Audio Gallery preview root is missing");

createRoot(root).render(
  <StrictMode>
    <AudioGallery />
  </StrictMode>,
);
