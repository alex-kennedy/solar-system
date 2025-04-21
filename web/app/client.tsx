"use client";

import React from "react";
import dynamic from "next/dynamic";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";

const Scene = dynamic(() => import("./src/components/Scene"), { ssr: false });

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#67D864",
    },
  },
  typography: {
    fontFamily: [
      "Sarabun",
      "-apple-system",
      "Roboto",
      "sans-serif",
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(","),
    h1: {
      fontWeight: "800",
      lineHeight: "150%",
    },
  },
});

export function ClientOnly() {
  return (
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div id="container">
          <Scene />
        </div>
      </ThemeProvider>
    </React.StrictMode>
  );
}
