// src/theme.ts
//
// Single source of truth for the widget card "shell": border radius,
// border, background and the hover lift/shadow. Previously each of these
// lived as a hand-maintained CSS custom property in WidgetBase.css, which
// meant a single bad edit (or a stray find/replace) could silently break
// every widget's chrome at once with no type-checking to catch it.
//
// Widgets still render as plain divs internally (title/body layout,
// container queries, per-widget CSS) — only the outer wrapper is now an
// MUI <Card>, themed here instead of via ad-hoc CSS variables.
import { createTheme, type Theme } from "@mui/material/styles";

const WIDGET_BORDER_RADIUS = 12;

export const getAppTheme = (mode: "light" | "dark"): Theme =>
  createTheme({
    palette: {
      mode,
      primary: { main: "#d94d14" },
      background: {
        default: mode === "dark" ? "#1b1b1b" : "#ededee",
        paper: mode === "dark" ? "#333333" : "#ffffff",
      },
      text: {
        primary: mode === "dark" ? "#f0f0f0" : "#202020",
        secondary: mode === "dark" ? "#b6b6b6" : "#5a5a5a",
      },
      divider:
        mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
    },
    shape: {
      borderRadius: WIDGET_BORDER_RADIUS,
    },
    components: {
      MuiCard: {
        defaultProps: {
          variant: "outlined",
        },
        styleOverrides: {
          root: ({ theme }) => ({
            position: "relative",
            transition: theme.transitions.create(["transform", "box-shadow"], {
              duration: 180,
            }),
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 2px 14px rgba(0, 0, 0, 0.45)",
            },
          }),
        },
      },
    },
  });
