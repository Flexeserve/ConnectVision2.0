// src/components/RoleSelector.tsx
import React from "react";
import "./RoleSelector.css";
import { Box, Typography, Button } from "@mui/material";
import BackButton from "./BackButton";
import businessManagerImage from "../assets/BusinessManager.jpg";
import operatorImage from "../assets/Operator.jpg";

export type Role = "manager" | "operator";

type Props = {
  onSelect: (role: Role) => void;
  onClose?: () => void;
  onBack?: () => void;
};

export default function RoleSelector({ onSelect, onClose, onBack }: Props) {
  const [mounted, setMounted] = React.useState(false);
  const [animating, setAnimating] = React.useState<Role | null>(null);
  React.useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => {
      cancelAnimationFrame(raf);
      setMounted(false);
    };
  }, []);

  const handleClick = (role: Role) => {
    console.log("RoleSelector: clicked", role);
    if (animating) return;
    setAnimating(role);
    onSelect(role);
    onClose?.();
    setAnimating(null);
  };

  return (
    <div
      className={`role-selector ${mounted ? "fade-in" : ""}`}
      role="region"
      aria-label="Choose view"
    >
      {onBack && (
        <div className="role-back">
          <BackButton onClick={onBack} color="#ffffff" />
        </div>
      )}
      <div
        className={`panel left ${animating === "manager" ? "slide-out-right" : ""}`}
      >
        <div
          className="panel-bg"
          style={{ backgroundImage: `url(${businessManagerImage})` }}
          aria-hidden
        />
        <div className="panel-content-wrapper">
          <Box
            className="panel-content"
            textAlign="center"
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Typography sx={{ color: "#fff", fontWeight: 600 }} variant="h3" gutterBottom>
              Business Manager
            </Typography>
            <Typography
              sx={{
                mb: 2,
                maxWidth: 420,
                mx: "auto",
                color: "#fff",
                fontFamily: '"Inter", "Inter var", sans-serif',
              }}
            >
              Remote management of all connected devices across the business.
            </Typography>
            <Button
              variant="contained"
              onClick={() => handleClick("manager")}
              sx={{ backgroundColor: "#d94d14" }}
              className="panel-cta-button"
            >
              View Business Manager
            </Button>
          </Box>
        </div>
      </div>

      <div
        className={`panel right ${animating === "operator" ? "slide-out-left" : ""}`}
      >
        <div
          className="panel-bg"
          style={{ backgroundImage: `url(${operatorImage})` }}
          aria-hidden
        />
        <div className="panel-content-wrapper">
          <Box
            className="panel-content"
            textAlign="center"
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Typography sx={{ color: "#fff", fontWeight: 600 }} variant="h3" gutterBottom>
              Operator
            </Typography>
            <Typography
              sx={{
                mb: 2,
                maxWidth: 420,
                mx: "auto",
                color: "#fff",
                fontFamily: '"Inter", "Inter var", sans-serif',
              }}
            >
              On-site interaction with connected devices within the parameters set-out by the business manager.
            </Typography>
            <Button
              variant="contained"
              onClick={() => handleClick("operator")}
              sx={{ backgroundColor: "#d94d14", fontWeight: "bold" }}
              className="panel-cta-button"
            >
              View Operator
            </Button>
          </Box>
        </div>
      </div>
    </div>
  );
}
