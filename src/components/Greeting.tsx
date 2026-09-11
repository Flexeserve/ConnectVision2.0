import TypewriterText from "./TypewriterText";
import { useCityName } from "../hooks/useCityName";

// Morning / afternoon / evening, from the viewer's local clock.
function timeOfDayGreeting(hour = new Date().getHours()): string {
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

/**
 * The dashboard greeting — an animated "Good Morning/Afternoon/Evening, <city>"
 * in the accent colour, with the city resolved from the visitor's location
 * and the time-of-day phrase from their local clock. Shared by the Business
 * Manager and Operator views; pass `className` for page-specific spacing
 * (min-height, margins, flex basis).
 */
export default function Greeting({ className = "" }: { className?: string }) {
  const city = useCityName("London");
  return (
    <div
      className={`flex w-full items-center px-6 text-left text-5xl font-extrabold text-accent sm:px-12 sm:text-6xl ${className}`}
    >
      <TypewriterText text={`${timeOfDayGreeting()}, ${city}`} />
    </div>
  );
}
