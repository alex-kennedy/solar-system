import React from "react";
import { createRoot } from "react-dom/client";
import Index from "./pages/index";
import Info from "./pages/info/info";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";

import "./assets/css/index.css";

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

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
    errorElement: <Index />,
  },
  {
    path: "/info",
    element: <Info />,
  },
]);

const container = document.getElementById("wrapper")!;
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);
