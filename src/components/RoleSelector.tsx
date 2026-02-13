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
    const delayMs = 600;
    onSelect(role);
    window.setTimeout(() => {
      onClose?.();
      setAnimating(null);
    }, delayMs);
  };

  return (
    <div
      className={`role-selector ${mounted ? "fade-in" : ""}`}
      role="region"
      aria-label="Choose view"
    >
      {onBack && (
        <div className="role-back">
          <BackButton onClick={onBack} />
        </div>
      )}
      <div
        className={`panel left ${animating === "manager" ? "slide-out-right" : ""}`}
        style={{
          backgroundImage: `url(${businessManagerImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
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
            <Typography sx={{ color: "#fff" }} variant="h3" gutterBottom>
              Business Manager
            </Typography>
            <Typography
              sx={{
                mb: 2,
                maxWidth: 420,
                mx: "auto",
                color: "#fff",
              }}
            >
              Manage inventory, analytics and operations.
            </Typography>
            <Button
              variant="contained"
              onClick={() => handleClick("manager")}
              sx={{ backgroundColor: "#d94d14" }}
              className="panel-cta-button"
            >
              Open Manager
            </Button>
          </Box>
        </div>
      </div>

      <div
        className={`panel right ${animating === "operator" ? "slide-out-left" : ""}`}
        style={{
          backgroundImage: `url(${operatorImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
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
            <Typography sx={{ color: "#fff" }} variant="h3" gutterBottom>
              Operator
            </Typography>
            <Typography
              sx={{
                mb: 2,
                maxWidth: 420,
                mx: "auto",
                color: "#fff",
              }}
            >
              Fast operational controls & workflows.
            </Typography>
            <Button
              variant="contained"
              onClick={() => handleClick("operator")}
              sx={{ backgroundColor: "#d94d14" }}
              className="panel-cta-button"
            >
              Open Operator
            </Button>
          </Box>
        </div>
      </div>
    </div>
  );
}
