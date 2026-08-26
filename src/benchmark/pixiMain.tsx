import { createRoot } from "react-dom/client";

import { PixiBenchmark } from "./PixiBenchmark";
import "./benchmark.css";

const root = document.getElementById("root");
if (root === null) throw new Error("Benchmark root is missing.");
createRoot(root).render(<PixiBenchmark />);
