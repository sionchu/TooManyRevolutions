import { createRoot } from "react-dom/client";

import { R3FBenchmark } from "./R3FBenchmark";
import "./benchmark.css";

const root = document.getElementById("root");
if (root === null) throw new Error("Benchmark root is missing.");
createRoot(root).render(<R3FBenchmark />);
