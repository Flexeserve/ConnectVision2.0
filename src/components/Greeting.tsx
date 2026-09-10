import TypewriterText from "./TypewriterText";
import { useCityName } from "../hooks/useCityName";

/**
 * The dashboard greeting — an animated "Good Morning, <city>" in the accent
 * colour, with the city resolved from the visitor's location. Shared by the
 * Business Manager and Operator views; pass `className` for page-specific
 * spacing (min-height, margins, flex basis).
 */
export default function Greeting({ className = "" }: { className?: string }) {
  const city = useCityName("London");
  return (
    <div
      className={`flex w-full items-center px-6 text-left text-5xl font-extrabold text-accent sm:px-12 sm:text-6xl ${className}`}
    >
      <TypewriterText text={`Good Morning, ${city}`} />
    </div>
  );
}
