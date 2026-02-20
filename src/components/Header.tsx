import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Popover,
  FormControlLabel,
  Switch,
} from "@mui/material";
import settingsIcon from "../assets/SettingsIcon.svg";
import React from "react";
import BackButton from "./BackButton";
import flexeserveLogo from "../assets/flexeserveLogo.svg";
import flexeserveLogoInversed from "../assets/flexeserveLogoInversed.svg";

type Props = { onBack?: () => void; title?: string };

export default function Header({ onBack, title }: Props) {
  const [now, setNow] = React.useState(() => new Date());
  const [settingsAnchor, setSettingsAnchor] =
    React.useState<HTMLElement | null>(null);
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("cv_theme") === "dark";
  });
  const [darkModeLabel, setDarkModeLabel] = React.useState("Dark mode");
  const [lightModeLabel, setLightModeLabel] = React.useState("Light mode");

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("dark", isDarkMode);
    if (typeof window !== "undefined") {
      localStorage.setItem("cv_theme", isDarkMode ? "dark" : "light");
    }
  }, [isDarkMode]);

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const handleThemeChange = () => {
      setIsDarkMode(document.body.classList.contains("dark"));
    };
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const managerTitles = new Set([
      "manager view",
      "business manager",
      "business manager view",
    ]);
    const operatorTitles = new Set(["operator view", "operator"]);
    if (!title) {
      setDarkModeLabel("Dark mode");
      setLightModeLabel("Light mode");
      return;
    }
    const normalized = title.toLowerCase().trim();
    if (managerTitles.has(normalized)) {
      setDarkModeLabel("Dark manager view");
      setLightModeLabel("Light manager view");
      return;
    }
    if (operatorTitles.has(normalized)) {
      setDarkModeLabel("Dark operator view");
      setLightModeLabel("Light operator view");
      return;
    }
    setDarkModeLabel("Dark mode");
    setLightModeLabel("Light mode");
  }, [title]);

  React.useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const timeLabel = now.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <AppBar
      position="static"
      color="default"
      sx={{
        backgroundColor: "var(--header-bg)",
        color: "var(--header-text)",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.35)",
        borderBottom: "1px solid var(--border-color)",
        position: "relative",
        zIndex: 2,
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box display="flex" alignItems="center" gap={2}>
          {onBack && <BackButton onClick={onBack} />}
          <Box
            component="img"
            src={isDarkMode ? flexeserveLogoInversed : flexeserveLogo}
            alt="Flexeserve Logo"
            className="header-logo"
            sx={{ height: 20 }}
          />
          {title && (
            <>
              <Typography
                component="span"
                aria-hidden
                sx={{
                  fontFamily: '"Inter", "Inter var", sans-serif',
                  fontWeight: 600,
                  color: "var(--header-text)",
                }}
              >
                |
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  fontFamily: '"Inter", "Inter var", sans-serif',
                  fontWeight: 600,
                  color: "var(--header-text)",
                }}
              >
                {title}
              </Typography>
            </>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            {timeLabel}
          </Typography>
          <IconButton
            className="settings-button"
            color="inherit"
            aria-label="Settings"
            onClick={(event) => setSettingsAnchor(event.currentTarget)}
          >
            <Box
              component="img"
              src={settingsIcon}
              alt=""
              sx={{
                width: 48,
                height: 48,
                background:
                  "linear-gradient(45deg, #d94d14 0%, #f06a24 100%)",
                borderRadius: "6px",
                padding: "2px 12px",
              }}
            />
          </IconButton>
          <Popover
            open={Boolean(settingsAnchor)}
            anchorEl={settingsAnchor}
            onClose={() => setSettingsAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <Box sx={{ p: 2, minWidth: 220 }}>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Appearance
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={isDarkMode}
                    onChange={(event) => setIsDarkMode(event.target.checked)}
                  />
                }
                label={isDarkMode ? darkModeLabel : lightModeLabel}
              />
            </Box>
          </Popover>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
