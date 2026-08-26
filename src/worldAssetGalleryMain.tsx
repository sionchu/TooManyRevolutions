import { createRoot } from "react-dom/client";

import { WorldAssetGallery } from "./app/mapVisual/WorldAssetGallery";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("The world asset gallery root element is missing.");
}

createRoot(rootElement).render(<WorldAssetGallery />);
