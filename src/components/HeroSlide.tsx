// src/components/HeroSlide.tsx
import React from "react";
import "./HeroSlide.css";
import { Box, Button } from "@mui/material";
//import heroVideo from "../assets/HeroBackground.mp4";
import Threads from "./Threads";

type Props = {
  visible: boolean;
  onClose: () => void; // called only when "Get started" is pressed
};

export default function HeroSlide({ visible, onClose }: Props) {
  const primaryRef = React.useRef<HTMLButtonElement | null>(null);

  // Focus the primary CTA when the hero becomes visible
  React.useEffect(() => {
    if (visible) primaryRef.current?.focus();
  }, [visible]);

  return (
    <div
      className={`hero-root ${visible ? "hero-visible" : "hero-hidden"}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="hero-title"
    >
      <div className="video-background">
        <Threads
          color={[0.8509803921568627, 0.30196078431372547, 0.0784313725490196]}
          amplitude={0.6}
          distance={0}
          enableMouseInteraction={false}
        />
      </div>
      <Box className="hero-content">
        <div className="hero-title" id="hero-title">
          <div className="hero-logo"></div>
          <div className="hero-subtitle">SUBTEXT WILL GO HERE LOL</div>
        </div>
        <div className="hero-cta">
          <Button
            variant="contained"
            onClick={onClose}
            ref={primaryRef}
            aria-label="Get started"
            sx={{
              px: 5,
              py: 2.2,
              minWidth: "16rem",
              fontSize: "1.05rem",
              fontWeight: 800,
              letterSpacing: "0.8em",
              textTransform: "uppercase",
              color: "#333333",
              borderRadius: "999px",
              position: "relative",
              background: "transparent",

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
            GET STARTED
          </Button>
          <div className="hero-arrow" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      </Box>
    </div>
  );
}
