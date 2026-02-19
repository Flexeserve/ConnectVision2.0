import React from "react";
import "./DevShortcutsHelp.css";

const SHORTCUTS = [
  { keys: "Ctrl + Shift + B", desc: "Toggle beacon drag mode" },
  { keys: "Ctrl + Shift + H", desc: "Hide/show all beacons" },
  { keys: "Ctrl + Shift + 0", desc: "Reset beacon positions" },
  { keys: "Shift + C", desc: "Toggle operator camera controls" },
  { keys: "Shift + D", desc: "Toggle operator light debug gizmos" },
];

export default function DevShortcutsHelp() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="dev-help-root">
      {open ? (
        <div className="dev-help-panel" role="dialog" aria-label="Developer shortcuts">
          <div className="dev-help-title">Dev Shortcuts</div>
          <div className="dev-help-list">
            {SHORTCUTS.map((item) => (
              <div className="dev-help-row" key={item.keys}>
                <span className="dev-help-keys">{item.keys}</span>
                <span className="dev-help-desc">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <button
        type="button"
        className={`dev-help-button ${open ? "is-open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open developer shortcuts"
      >
        ?
      </button>
    </div>
  );
}
