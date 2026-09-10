import React from "react";

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
    <div className="fixed bottom-3.5 right-3.5 z-[11000] flex flex-col items-end gap-2">
      {open ? (
        <div
          className="min-w-[320px] max-w-[420px] rounded-[10px] border border-line-strong bg-surface p-3 text-ink shadow-[0_10px_28px_rgba(0,0,0,0.24)]"
          role="dialog"
          aria-label="Developer shortcuts"
        >
          <div className="mb-2 text-[0.8rem] font-bold uppercase tracking-wider">
            Dev Shortcuts
          </div>
          <div className="flex flex-col gap-1.5">
            {SHORTCUTS.map((item) => (
              <div
                className="flex items-center justify-between gap-2.5"
                key={item.keys}
              >
                <span className="text-xs font-bold text-ink">{item.keys}</span>
                <span className="text-right text-xs text-ink-muted">
                  {item.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <button
        type="button"
        className={`size-7 rounded-full border border-line-strong bg-surface text-sm font-extrabold text-ink transition-opacity hover:opacity-75 ${
          open ? "opacity-75" : "opacity-10"
        }`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open developer shortcuts"
      >
        ?
      </button>
    </div>
  );
}
