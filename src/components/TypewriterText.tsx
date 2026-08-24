import React from "react";

interface TypewriterTextProps {
  text: string;
  speed?: number;
  startDelay?: number;
  className?: string;
  cursor?: boolean;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 45,
  startDelay = 150,
  className = "",
  cursor = true,
}) => {
  const [visibleChars, setVisibleChars] = React.useState(0);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    setVisibleChars(0);
    setDone(false);

    let charTimer: ReturnType<typeof setInterval> | null = null;

    const startTimer = setTimeout(() => {
      let count = 0;
      charTimer = setInterval(() => {
        count += 1;
        setVisibleChars(count);
        if (count >= text.length) {
          if (charTimer) clearInterval(charTimer);
          setDone(true);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(startTimer);
      if (charTimer) clearInterval(charTimer);
    };
  }, [text, speed, startDelay]);

  return (
    <span className={`typewriter-text ${className}`}>
      <span>{text.slice(0, visibleChars)}</span>
      {cursor && !done && (
        <span className="typewriter-cursor" aria-hidden>
          |
        </span>
      )}
      <span className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        {text}
      </span>
    </span>
  );
};

export default TypewriterText;
