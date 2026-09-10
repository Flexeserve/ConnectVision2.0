// src/components/RoleSelector.tsx
import React from "react";
import "./RoleSelector.css";
import BackButton from "./BackButton";
import businessManagerImage from "../assets/BusinessManager.webp";
import operatorImage from "../assets/Operator.webp";

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
          <BackButton onClick={onBack} className="!text-white hover:!bg-white/15" />
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
          <div className="panel-content flex w-full flex-col items-center justify-center gap-3 text-center">
            <h3 className="text-4xl font-semibold text-white">Business Manager</h3>
            <p className="mx-auto mb-2 max-w-[420px] text-white">
              Remote management of all connected devices across the business.
            </p>
            <button
              type="button"
              onClick={() => handleClick("manager")}
              className="panel-cta-button rounded-lg bg-accent px-5 py-2.5 font-semibold text-white shadow-md transition-transform hover:scale-[1.03]"
            >
              View Business Manager
            </button>
          </div>
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
          <div className="panel-content flex w-full flex-col items-center justify-center gap-3 text-center">
            <h3 className="text-4xl font-semibold text-white">Operator</h3>
            <p className="mx-auto mb-2 max-w-[420px] text-white">
              On-site interaction with connected devices within the parameters
              set-out by the business manager.
            </p>
            <button
              type="button"
              onClick={() => handleClick("operator")}
              className="panel-cta-button rounded-lg bg-accent px-5 py-2.5 font-bold text-white shadow-md transition-transform hover:scale-[1.03]"
            >
              View Operator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
