import React from "react";

type Size = {
  width: number;
  height: number;
};

export default function useElementSize<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null);
  const [size, setSize] = React.useState<Size>({ width: 0, height: 0 });

  React.useEffect(() => {
    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }
    const node = ref.current;
    if (!node) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry?.contentRect) return;
      const { width, height } = entry.contentRect;
      setSize((prev) => {
        if (prev.width === width && prev.height === height) {
          return prev;
        }
        return { width, height };
      });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}
