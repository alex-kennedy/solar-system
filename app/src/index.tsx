import React from "react";
import { createRoot } from "react-dom/client";
import Index from "./pages/index";

import "./assets/css/index.css";

const container = document.getElementById("wrapper")!;
const root = createRoot(container);
root.render(<Index />);
