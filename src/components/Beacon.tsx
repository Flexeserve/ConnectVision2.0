import "./Beacon.css";
import React from "react";
import { Tooltip } from "@heroui/react";

export type BeaconOffset = {
  x: number;
  y: number;
};

type Props = {
  onClick?: () => void;
  label?: string;
  beaconId?: string;
  devMode?: boolean;
  offset?: BeaconOffset;
  onOffsetChange?: (next: BeaconOffset) => void;
  /** Which corner of the positioned ancestor the beacon badges. */
  corner?: "bottom-right" | "top-right";
  /** Hover/focus tooltip copy — defaults to `label`. */
  tooltip?: string;
};

export default function Beacon({
  onClick,
  label = "Open tour",
  beaconId,
  devMode = false,
  offset,
  onOffsetChange,
  corner = "bottom-right",
  tooltip,
}: Props) {
  const dragStateRef = React.useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!devMode) return;
    event.preventDefault();
    event.stopPropagation();
    const originX = offset?.x ?? 0;
    const originY = offset?.y ?? 0;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX,
      originY,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!devMode || !dragStateRef.current) return;
    if (dragStateRef.current.pointerId !== event.pointerId) return;
    const dx = event.clientX - dragStateRef.current.startX;
    const dy = event.clientY - dragStateRef.current.startY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      dragStateRef.current.moved = true;
    }
    onOffsetChange?.({
      x: Math.round(dragStateRef.current.originX + dx),
      y: Math.round(dragStateRef.current.originY + dy),
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragStateRef.current) return;
    if (dragStateRef.current.pointerId === event.pointerId) {
      dragStateRef.current = null;
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (devMode) {
      event.preventDefault();
      return;
    }
    onClick?.();
  };

  const button = (
    <button
      type="button"
      className={`beacon-button ${devMode ? "beacon-button--dev" : ""} ${
        corner === "top-right" ? "beacon-button--top-right" : ""
      }`}
      aria-label={label}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        transform:
          (offset?.x ?? 0) || (offset?.y ?? 0)
            ? `translate(${offset?.x ?? 0}px, ${offset?.y ?? 0}px)`
            : undefined,
      }}
    >
      <span className="beacon-dot" aria-hidden />
      {devMode && beaconId ? (
        <span className="beacon-dev-id" aria-hidden>
          {beaconId}
        </span>
      ) : null}
    </button>
  );

  return (
    <Tooltip
      content={tooltip ?? label}
      placement={corner === "top-right" ? "bottom" : "top"}
      showArrow
      delay={250}
      closeDelay={0}
    >
      {button}
    </Tooltip>
  );
}
