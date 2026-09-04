// src/theme.ts
//
// Minimal MUI theme for the widget Cards — just palette.mode so Card
// responds to light/dark, nothing else customized. No border-radius,
// border, hover, or color overrides: widgets render with MUI's own
// default Card look rather than a hand-tuned one.
import { createTheme, type Theme } from "@mui/material/styles";

export const getAppTheme = (mode: "light" | "dark"): Theme =>
  createTheme({
    palette: { mode },
  });
