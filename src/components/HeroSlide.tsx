// src/components/HeroSlide.tsx
import React from "react";
import "./HeroSlide.css";

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
      <div className="hero-content">
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
                {/* Sized as a kiosk touch target, not a desktop link. */}
                <button
                  type="button"
                  onClick={onClose}
                  ref={primaryRef}
                  aria-label="Get started"
                  className="hero-get-connected relative min-h-[3.75rem] min-w-[16rem] rounded-[18px] bg-accent px-8 py-4 text-xl font-extrabold tracking-[0.01em] text-white shadow-[0_10px_24px_rgba(217,77,20,0.4)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_14px_28px_rgba(217,77,20,0.48)] active:translate-y-0 active:scale-[0.97] focus-visible:outline-[3px] focus-visible:outline-white focus-visible:outline-offset-[3px]"
                >
                  Get Connected
                </button>
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
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? (
            // Moon icon: shown while dark mode is active; click switches to light.
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden>
              <path
                d="M20.354 15.354A9 9 0 0 1 8.646 3.646 9.003 9.003 0 1 0 20.354 15.354Z"
                fill="currentColor"
              />
            </svg>
          ) : (
            // Sun icon: shown while light mode is active; click switches to dark.
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="4.5" fill="currentColor" />
              <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M12 2.5v2.4M12 19.1v2.4M21.5 12h-2.4M4.9 12H2.5" />
                <path d="M18.36 5.64l-1.7 1.7M7.34 16.66l-1.7 1.7M18.36 18.36l-1.7-1.7M7.34 7.34l-1.7-1.7" />
              </g>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
