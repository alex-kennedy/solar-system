"use client";

import dynamic from "next/dynamic";

const App = dynamic(() => import("./src/pages/index"), { ssr: false });

export function ClientOnly() {
  return <App />;
}
