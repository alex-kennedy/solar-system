"use client";

import React from "react";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";

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

export function Theme({ children }: { children: React.ReactNode }) {
  return (
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </React.StrictMode>
  );
}
