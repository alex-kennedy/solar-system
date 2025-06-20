"use client";

import React from "react";
import dynamic from "next/dynamic";

const Scene = dynamic(() => import("@/components/Scene"), { ssr: false });

export function ClientOnly() {
  return (
    <div id="container">
      <Scene />
    </div>
  );
}
