// src/components/HeroSlide.tsx
import React from "react";
import "./HeroSlide.css";
import { Box, Button } from "@mui/material";

import heroProductImage from "../assets/HeroImage.webp";
import heroFanIcon from "../assets/Flexeserve fan icon watermark light grey.svg";
import flexeserveSaffronIcon from "../assets/FlexeserveSaffron.svg";

type Props = {
  visible: boolean;
  onClose: () => void; // called only when "Get started" is pressed
};

export default function HeroSlide({ visible, onClose }: Props) {
  const primaryRef = React.useRef<HTMLButtonElement | null>(null);
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("cv_theme") === "dark";
  });

  // Focus the primary CTA when the hero becomes visible
  React.useEffect(() => {
    if (visible) primaryRef.current?.focus();
  }, [visible]);

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

  return (
    <div
      className={`hero-root ${visible ? "hero-visible" : "hero-hidden"}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="hero-title"
    >
      <Box className="hero-content">
        <div className="hero-layout">
          <div className="hero-left">
            <div className="hero-title" id="hero-title">
              <div className="hero-logo"></div>
              <div className="hero-subtitle">Control. Automate. Optimise.</div>
            </div>
            <div className="hero-cta-block">
              <div className="hero-arrow" aria-hidden="true">
                <img
                  src={flexeserveSaffronIcon}
                  alt=""
                  className="hero-arrow-icon"
                />
              </div>
              <div className="hero-cta">
                <Button
                  variant="contained"
                  onClick={onClose}
                  ref={primaryRef}
                  aria-label="Get started"
                  className="hero-get-connected"
                  sx={{
                    px: 2,
                    py: 1,
                    minWidth: "12rem",
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    textTransform: "none",
                    color: "#fff",
                    borderRadius: "16px",
                    position: "relative",
                    background: "#d94d14",
                    transition:
                      "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s ease",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      inset: 0,
                      borderRadius: "inherit",
                      padding: "2px",
                      background:
                        "linear-gradient(120deg, rgba(255,255,255,0.25), transparent 60%)",
                      WebkitMask:
                        "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      WebkitMaskComposite: "xor",
                      maskComposite: "exclude",
                      opacity: 0.4,
                      pointerEvents: "none",
                    },
                    "&:hover": {
                      transform: "translateY(-4px) scale(1.03)",
                    },
                    "&:active": {
                      transform: "translateY(-1px) scale(0.99)",
                    },
                    "&:focus-visible": {},
                  }}
                >
                  Get Connected
                </Button>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <img src={heroFanIcon} alt="" aria-hidden className="hero-right-fan" />
            <div className="hero-visual" aria-hidden="true">
              <img
                src={heroProductImage}
                alt="Flexeserve Connect preview"
                className="hero-visual-image"
              />
              <img
                src={heroProductImage}
                alt=""
                aria-hidden="true"
                className="hero-visual-image hero-visual-reflection"
              />
            </div>
            
          </div>
        </div>
        <div
          className="hero-footer-note"
          aria-label="Flexeserve copyright notice"
        >
          © Flexeserve 2026
        </div>
        <button
          type="button"
          className="hero-theme-toggle"
          onClick={() => setIsDarkMode((prev) => !prev)}
          aria-label="Toggle dark mode"
        >
          <span className="hero-theme-label">
            {isDarkMode ? "Dark" : "Light"} mode
          </span>
          <span
            className={`hero-theme-switch ${isDarkMode ? "is-on" : ""}`}
            aria-hidden
          />
        </button>
      </Box>
    </div>
  );
}
