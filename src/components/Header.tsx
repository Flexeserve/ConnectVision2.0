import { AppBar, Toolbar, Box, Typography, IconButton } from "@mui/material";
import settingsIcon from "../assets/SettingsIcon.svg";
import React from "react";
import BackButton from "./BackButton";
import marketLogo from "../assets/MarketLogo.svg";

type Props = { onBack?: () => void; title?: string };

export default function Header({ onBack, title }: Props) {
  const [now, setNow] = React.useState(() => new Date());
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
        backgroundColor: "#ededee",
        color: "#202020",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.35)",
        borderBottom: "1px solid #b1b1b1ff",
        position: "relative",
        zIndex: 2,
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box display="flex" alignItems="center" gap={2}>
          {onBack && <BackButton onClick={onBack} />}
          <Box
            component="img"
            src={marketLogo}
            alt="Market Logo"
            className="header-logo"
            sx={{ height: 40 }}
          />
          {title && (
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, color: "#202020" }}
            >
              {title}
            </Typography>
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
        </Box>
      </Toolbar>
    </AppBar>
  );
}
